import * as vehicleRepo from '../repositories/vehicleRepository.js';
import * as cardRepo from '../repositories/cardRepository.js';

export const getVehicles = async (userId: string) => {
  return vehicleRepo.findVehiclesByUserId(userId);
};

export const registerVehicle = async (
  userId: string,
  registration: string,
  province: string,
  brand: string,
  model: string,
  color: string,
  cardId: string
) => {
  // Verify the card belongs to the authenticated user
  const card = await cardRepo.findCardById(cardId);
  if (!card) {
    throw new Error('Card not found.');
  }
  if (card.user_id !== userId) {
    throw new Error('You do not own this card.');
  }

  return vehicleRepo.createVehicle({ registration, province, brand, model, color, cardIds: [cardId] });
};

export const updateVehicle = async (
  userId: string,
  vehicleId: string,
  data: { registration?: string; province?: string; brand?: string; model?: string; color?: string; card_id?: string }
) => {
  const vehicle = await vehicleRepo.findVehicleById(vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found.');
  }

  // Verify user has access via linked cards
  const userCards = await cardRepo.findCardsByUserId(userId);
  const userCardIds = new Set(userCards.map((c) => c.card_id));
  const hasAccess = vehicle.cards.some((c) => userCardIds.has(c.card_id));
  if (!hasAccess) {
    throw new Error('You do not have access to this vehicle.');
  }

  // If changing the linked card, verify ownership of the new card
  const updateData: { registration?: string; province?: string; brand?: string; model?: string; color?: string; cardIds?: string[] } = {};
  if (data.registration !== undefined) updateData.registration = data.registration;
  if (data.province !== undefined) updateData.province = data.province;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.card_id !== undefined) {
    const newCard = await cardRepo.findCardById(data.card_id);
    if (!newCard || newCard.user_id !== userId) {
      throw new Error('You do not own the target card.');
    }
    updateData.cardIds = [data.card_id];
  }

  return vehicleRepo.updateVehicle(vehicleId, updateData);
};

export const deleteVehicle = async (userId: string, vehicleId: string) => {
  const vehicle = await vehicleRepo.findVehicleById(vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found.');
  }

  // Verify user has access via linked cards
  const userCards = await cardRepo.findCardsByUserId(userId);
  const userCardIds = new Set(userCards.map((c) => c.card_id));
  const hasAccess = vehicle.cards.some((c) => userCardIds.has(c.card_id));
  if (!hasAccess) {
    throw new Error('You do not have access to this vehicle.');
  }

  return vehicleRepo.deleteVehicle(vehicleId);
};
