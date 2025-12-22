/**
 * GraphQL Schema Definition
 * Type definitions for TravelHub GraphQL API
 */

export const typeDefs = `#graphql
  # ============================================
  # SCALARS
  # ============================================

  scalar DateTime
  scalar JSON

  # ============================================
  # ENUMS
  # ============================================

  enum UserRole {
    USER
    ADMIN
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  enum TravelType {
    FLIGHT
    HOTEL
    CAR
  }

  # ============================================
  # TYPES
  # ============================================

  type User {
    id: ID!
    email: String!
    name: String
    role: UserRole!
    tenantId: String
    createdAt: DateTime!
    bookings(limit: Int, offset: Int): [Booking!]!
    favorites(limit: Int, offset: Int): [Favorite!]!
    reviews(limit: Int, offset: Int): [Review!]!
  }

  type Booking {
    id: ID!
    userId: String!
    type: TravelType!
    status: BookingStatus!
    details: JSON!
    totalPrice: Float!
    commission: Float
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User
  }

  type Favorite {
    id: ID!
    userId: String!
    type: TravelType!
    itemId: String!
    details: JSON!
    createdAt: DateTime!
    user: User
  }

  type Review {
    id: ID!
    userId: String!
    bookingId: String
    rating: Int!
    comment: String
    createdAt: DateTime!
    user: User
    booking: Booking
  }

  type PriceAlert {
    id: ID!
    userId: String!
    type: TravelType!
    route: String!
    targetPrice: Float!
    currentPrice: Float
    isActive: Boolean!
    createdAt: DateTime!
    user: User
  }

  type HealthMetrics {
    uptime: Float!
    requestsTotal: Int!
    requestsSuccess: Int!
    requestsFailed: Int!
    averageResponseTime: Float!
    timestamp: DateTime!
  }

  # ============================================
  # INPUT TYPES
  # ============================================

  input CreateBookingInput {
    type: TravelType!
    details: JSON!
    totalPrice: Float!
  }

  input UpdateBookingInput {
    status: BookingStatus
    details: JSON
  }

  input CreateReviewInput {
    bookingId: String!
    rating: Int!
    comment: String
  }

  input CreatePriceAlertInput {
    type: TravelType!
    route: String!
    targetPrice: Float!
  }

  input BookingFilter {
    status: BookingStatus
    type: TravelType
    minPrice: Float
    maxPrice: Float
    startDate: DateTime
    endDate: DateTime
  }

  # ============================================
  # PAGINATION
  # ============================================

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalCount: Int!
    page: Int!
    pageSize: Int!
  }

  type BookingsConnection {
    nodes: [Booking!]!
    pageInfo: PageInfo!
  }

  type UsersConnection {
    nodes: [User!]!
    pageInfo: PageInfo!
  }

  # ============================================
  # QUERIES
  # ============================================

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(limit: Int, offset: Int): UsersConnection!

    # Booking queries
    booking(id: ID!): Booking
    bookings(
      filter: BookingFilter
      limit: Int
      offset: Int
    ): BookingsConnection!
    myBookings(
      filter: BookingFilter
      limit: Int
      offset: Int
    ): BookingsConnection!

    # Favorite queries
    favorites(limit: Int, offset: Int): [Favorite!]!
    favorite(id: ID!): Favorite

    # Review queries
    reviews(bookingId: String, limit: Int, offset: Int): [Review!]!
    review(id: ID!): Review

    # Price alert queries
    priceAlerts(limit: Int, offset: Int): [PriceAlert!]!
    priceAlert(id: ID!): PriceAlert

    # Health & Stats
    health: HealthMetrics!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  type Mutation {
    # Booking mutations
    createBooking(input: CreateBookingInput!): Booking!
    updateBooking(id: ID!, input: UpdateBookingInput!): Booking!
    cancelBooking(id: ID!): Booking!

    # Review mutations
    createReview(input: CreateReviewInput!): Review!
    deleteReview(id: ID!): Boolean!

    # Favorite mutations
    addFavorite(type: TravelType!, itemId: String!, details: JSON!): Favorite!
    removeFavorite(id: ID!): Boolean!

    # Price alert mutations
    createPriceAlert(input: CreatePriceAlertInput!): PriceAlert!
    deletePriceAlert(id: ID!): Boolean!
    togglePriceAlert(id: ID!): PriceAlert!
  }

  # ============================================
  # SUBSCRIPTIONS (Future)
  # ============================================

  # type Subscription {
  #   bookingUpdated(userId: String!): Booking!
  #   priceAlertTriggered(userId: String!): PriceAlert!
  # }
`;
