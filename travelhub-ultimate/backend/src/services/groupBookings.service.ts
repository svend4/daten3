/**
 * Group Bookings Service
 * Handles multi-room bookings, split payments, and group management
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface GroupBooking {
  id: string;
  organizerId: string;
  name: string;
  type: 'hotel' | 'flight' | 'mixed';
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled';
  totalAmount: number;
  currency: string;
  participants: GroupParticipant[];
  rooms?: HotelRoom[];
  flights?: FlightSegment[];
  paymentPlan: 'split' | 'organizer_pays' | 'individual';
  splitPayments?: SplitPayment[];
  metadata: {
    checkIn?: string;
    checkOut?: string;
    destination?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupParticipant {
  id: string;
  userId?: string;
  email: string;
  name: string;
  status: 'invited' | 'accepted' | 'declined' | 'paid';
  roomAssignment?: string; // Room ID
  flightAssignment?: string; // Flight ID
  amountOwed: number;
  amountPaid: number;
  joinedAt?: Date;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  pricePerNight: number;
  nights: number;
  totalPrice: number;
  occupants: string[]; // Participant IDs
  preferences?: {
    beds?: string;
    floor?: string;
    view?: string;
  };
}

export interface FlightSegment {
  id: string;
  flightId: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  pricePerSeat: number;
  passengers: string[]; // Participant IDs
  seatAssignments?: Record<string, string>; // participantId -> seat
}

export interface SplitPayment {
  participantId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  paidAt?: Date;
  transactionId?: string;
}

/**
 * Create group booking
 */
export async function createGroupBooking(
  organizerId: string,
  data: {
    name: string;
    type: GroupBooking['type'];
    participants: Array<{ email: string; name: string }>;
    rooms?: HotelRoom[];
    flights?: FlightSegment[];
    paymentPlan: GroupBooking['paymentPlan'];
    metadata?: GroupBooking['metadata'];
  }
): Promise<GroupBooking> {
  try {
    logger.info(`Creating group booking: ${data.name}`);

    // Calculate total amount
    const roomsTotal = data.rooms?.reduce((sum, r) => sum + r.totalPrice, 0) || 0;
    const flightsTotal =
      data.flights?.reduce(
        (sum, f) => sum + f.pricePerSeat * f.passengers.length,
        0
      ) || 0;
    const totalAmount = roomsTotal + flightsTotal;

    // Create participants
    const participants: GroupParticipant[] = data.participants.map((p, index) => ({
      id: `participant_${Date.now()}_${index}`,
      email: p.email,
      name: p.name,
      status: 'invited',
      amountOwed: 0,
      amountPaid: 0,
    }));

    // Calculate split amounts if needed
    if (data.paymentPlan === 'split') {
      const perPersonAmount = totalAmount / participants.length;
      participants.forEach((p) => {
        p.amountOwed = perPersonAmount;
      });
    } else if (data.paymentPlan === 'organizer_pays') {
      // Organizer pays everything
      participants.forEach((p) => {
        p.amountOwed = 0;
      });
    }

    const groupBooking: GroupBooking = {
      id: `group_${Date.now()}`,
      organizerId,
      name: data.name,
      type: data.type,
      status: 'draft',
      totalAmount,
      currency: 'USD',
      participants,
      rooms: data.rooms,
      flights: data.flights,
      paymentPlan: data.paymentPlan,
      splitPayments: participants
        .filter((p) => p.amountOwed > 0)
        .map((p) => ({
          participantId: p.id,
          amount: p.amountOwed,
          status: 'pending',
        })),
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    // await prisma.groupBooking.create({ data: groupBooking });

    // Send invitations
    for (const participant of participants) {
      await sendInvitation(groupBooking.id, participant);
    }

    logger.info(`Group booking created: ${groupBooking.id}`);

    return groupBooking;
  } catch (error: any) {
    logger.error('Error creating group booking:', error);
    throw error;
  }
}

/**
 * Get group booking by ID
 */
export async function getGroupBooking(bookingId: string): Promise<GroupBooking> {
  try {
    logger.info(`Getting group booking: ${bookingId}`);

    // Mock group booking
    const groupBooking: GroupBooking = {
      id: bookingId,
      organizerId: 'user_123',
      name: 'Team Retreat - Miami',
      type: 'hotel',
      status: 'confirmed',
      totalAmount: 3000,
      currency: 'USD',
      participants: [
        {
          id: 'p1',
          email: 'john@example.com',
          name: 'John Doe',
          status: 'paid',
          roomAssignment: 'room_1',
          amountOwed: 1000,
          amountPaid: 1000,
        },
        {
          id: 'p2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          status: 'paid',
          roomAssignment: 'room_2',
          amountOwed: 1000,
          amountPaid: 1000,
        },
        {
          id: 'p3',
          email: 'bob@example.com',
          name: 'Bob Wilson',
          status: 'accepted',
          roomAssignment: 'room_3',
          amountOwed: 1000,
          amountPaid: 0,
        },
      ],
      rooms: [
        {
          id: 'room_1',
          hotelId: 'hotel_123',
          hotelName: 'Miami Beach Resort',
          roomType: 'Deluxe Suite',
          pricePerNight: 200,
          nights: 5,
          totalPrice: 1000,
          occupants: ['p1'],
        },
      ],
      paymentPlan: 'split',
      splitPayments: [
        {
          participantId: 'p1',
          amount: 1000,
          status: 'paid',
          paidAt: new Date('2025-12-20'),
          transactionId: 'txn_123',
        },
        {
          participantId: 'p2',
          amount: 1000,
          status: 'paid',
          paidAt: new Date('2025-12-21'),
          transactionId: 'txn_124',
        },
        {
          participantId: 'p3',
          amount: 1000,
          status: 'pending',
        },
      ],
      metadata: {
        checkIn: '2026-03-15',
        checkOut: '2026-03-20',
        destination: 'Miami, FL',
        notes: 'Company team building event',
      },
      createdAt: new Date('2025-12-15'),
      updatedAt: new Date('2025-12-21'),
    };

    return groupBooking;
  } catch (error: any) {
    logger.error('Error getting group booking:', error);
    throw error;
  }
}

/**
 * Add participant to group booking
 */
export async function addParticipant(
  bookingId: string,
  participantData: { email: string; name: string }
): Promise<GroupParticipant> {
  try {
    logger.info(`Adding participant to group booking ${bookingId}`);

    const groupBooking = await getGroupBooking(bookingId);

    // Recalculate split if needed
    let amountOwed = 0;
    if (groupBooking.paymentPlan === 'split') {
      amountOwed = groupBooking.totalAmount / (groupBooking.participants.length + 1);
    }

    const participant: GroupParticipant = {
      id: `participant_${Date.now()}`,
      email: participantData.email,
      name: participantData.name,
      status: 'invited',
      amountOwed,
      amountPaid: 0,
    };

    // Update booking
    // await prisma.groupBooking.update({
    //   where: { id: bookingId },
    //   data: {
    //     participants: { push: participant },
    //   },
    // });

    // Send invitation
    await sendInvitation(bookingId, participant);

    logger.info(`Participant added: ${participant.id}`);

    return participant;
  } catch (error: any) {
    logger.error('Error adding participant:', error);
    throw error;
  }
}

/**
 * Update participant status
 */
export async function updateParticipantStatus(
  bookingId: string,
  participantId: string,
  status: GroupParticipant['status']
): Promise<void> {
  try {
    logger.info(
      `Updating participant ${participantId} status to ${status} in booking ${bookingId}`
    );

    // Update database
    // await prisma.groupBooking.update({
    //   where: { id: bookingId },
    //   data: {
    //     participants: {
    //       updateMany: {
    //         where: { id: participantId },
    //         data: { status },
    //       },
    //     },
    //   },
    // });

    logger.info(`Participant status updated`);
  } catch (error: any) {
    logger.error('Error updating participant status:', error);
    throw error;
  }
}

/**
 * Assign room to participant
 */
export async function assignRoom(
  bookingId: string,
  participantId: string,
  roomId: string
): Promise<void> {
  try {
    logger.info(`Assigning room ${roomId} to participant ${participantId}`);

    const groupBooking = await getGroupBooking(bookingId);
    const room = groupBooking.rooms?.find((r) => r.id === roomId);

    if (!room) {
      throw new Error('Room not found');
    }

    // Check room capacity
    if (room.occupants.length >= 2) {
      throw new Error('Room is full');
    }

    // Update room occupants
    room.occupants.push(participantId);

    // Update database
    // await prisma.groupBooking.update({ ... });

    logger.info(`Room assigned`);
  } catch (error: any) {
    logger.error('Error assigning room:', error);
    throw error;
  }
}

/**
 * Process split payment
 */
export async function processSplitPayment(
  bookingId: string,
  participantId: string,
  paymentMethod: string
): Promise<SplitPayment> {
  try {
    logger.info(
      `Processing split payment for participant ${participantId} in booking ${bookingId}`
    );

    const groupBooking = await getGroupBooking(bookingId);
    const splitPayment = groupBooking.splitPayments?.find(
      (sp) => sp.participantId === participantId
    );

    if (!splitPayment) {
      throw new Error('Split payment not found');
    }

    if (splitPayment.status === 'paid') {
      throw new Error('Payment already completed');
    }

    // Process payment via payment service
    // const paymentResult = await stripeService.createPaymentIntent(
    //   splitPayment.amount,
    //   groupBooking.currency
    // );

    // Update payment status
    splitPayment.status = 'paid';
    splitPayment.paymentMethod = paymentMethod;
    splitPayment.paidAt = new Date();
    splitPayment.transactionId = `txn_${Date.now()}`;

    // Update participant status
    await updateParticipantStatus(bookingId, participantId, 'paid');

    // Check if all payments are complete
    const allPaid = groupBooking.splitPayments?.every((sp) => sp.status === 'paid');
    if (allPaid) {
      await confirmGroupBooking(bookingId);
    }

    logger.info(`Split payment processed: ${splitPayment.transactionId}`);

    return splitPayment;
  } catch (error: any) {
    logger.error('Error processing split payment:', error);
    throw error;
  }
}

/**
 * Confirm group booking
 */
async function confirmGroupBooking(bookingId: string): Promise<void> {
  logger.info(`Confirming group booking ${bookingId}`);

  // Update status
  // await prisma.groupBooking.update({
  //   where: { id: bookingId },
  //   data: { status: 'confirmed' },
  // });

  // Send confirmations to all participants
  const groupBooking = await getGroupBooking(bookingId);
  for (const participant of groupBooking.participants) {
    await sendConfirmation(bookingId, participant);
  }

  logger.info(`Group booking confirmed`);
}

/**
 * Send invitation email
 */
async function sendInvitation(
  bookingId: string,
  participant: GroupParticipant
): Promise<void> {
  logger.info(`Sending invitation to ${participant.email} for booking ${bookingId}`);

  // Use email service to send invitation
  // await emailService.sendEmail({
  //   to: participant.email,
  //   subject: 'Group Booking Invitation',
  //   template: 'group-booking-invitation',
  //   data: { bookingId, participant },
  // });
}

/**
 * Send confirmation email
 */
async function sendConfirmation(
  bookingId: string,
  participant: GroupParticipant
): Promise<void> {
  logger.info(`Sending confirmation to ${participant.email} for booking ${bookingId}`);

  // Use email service
  // await emailService.sendEmail({ ... });
}

/**
 * Get group booking summary
 */
export async function getGroupBookingSummary(bookingId: string): Promise<{
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  participantsCount: number;
  paidCount: number;
  status: string;
}> {
  const groupBooking = await getGroupBooking(bookingId);

  const paidAmount =
    groupBooking.splitPayments
      ?.filter((sp) => sp.status === 'paid')
      .reduce((sum, sp) => sum + sp.amount, 0) || 0;

  const pendingAmount = groupBooking.totalAmount - paidAmount;
  const paidCount = groupBooking.participants.filter((p) => p.status === 'paid').length;

  return {
    totalAmount: groupBooking.totalAmount,
    paidAmount,
    pendingAmount,
    participantsCount: groupBooking.participants.length,
    paidCount,
    status: groupBooking.status,
  };
}

export default {
  createGroupBooking,
  getGroupBooking,
  addParticipant,
  updateParticipantStatus,
  assignRoom,
  processSplitPayment,
  getGroupBookingSummary,
};
