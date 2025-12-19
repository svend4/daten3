// Получено от провайдера
const providerCommission = bookingAmount * (baseCommissionRate / 100);

// Партнёр Level 1
const affiliate1 = providerCommission * (level1Rate / 100);

// Партнёр Level 2
const affiliate2 = providerCommission * (level2Rate / 100);

// Партнёр Level 3
const affiliate3 = providerCommission * (level3Rate / 100);

// Прибыль TravelHub
const profit = providerCommission - (affiliate1 + affiliate2 + affiliate3);

// Маржа TravelHub
const margin = (profit / providerCommission) * 100;
