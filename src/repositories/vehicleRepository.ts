import { prisma } from '../config/db.js';

export const createVehicle = async (data: {
  registration: string;
  province: string;
  cardIds: string[];
}) => {
  return prisma.registeredVehicle.create({
    data: {
      registration: data.registration,
      province: data.province,
      cards: { connect: data.cardIds.map((id) => ({ card_id: id })) }
    },
    include: { cards: true }
  });
};

export const findVehicleById = async (vehicleId: string) => {
  return prisma.registeredVehicle.findUnique({
    where: { vehicle_id: vehicleId },
    include: { cards: true }
  });
};

export const updateVehicle = async (
  vehicleId: string,
  data: {
    registration?: string;
    province?: string;
    cardIds?: string[];
  }
) => {
  const updateData: Record<string, unknown> = {};
  if (data.registration !== undefined) updateData.registration = data.registration;
  if (data.province !== undefined) updateData.province = data.province;
  if (data.cardIds !== undefined) {
    updateData.cards = {
      set: data.cardIds.map((id) => ({ card_id: id }))
    };
  }

  return prisma.registeredVehicle.update({
    where: { vehicle_id: vehicleId },
    data: updateData,
    include: { cards: true }
  });
};

export const findVehiclesByUserId = async (userId: string) => {
  return prisma.registeredVehicle.findMany({
    where: { cards: { some: { user_id: userId } } },
    include: { cards: true }
  });
};

export const deleteVehicle = async (vehicleId: string) => {
  // Disconnect all cards before deleting (clean up M:N)
  await prisma.registeredVehicle.update({
    where: { vehicle_id: vehicleId },
    data: { cards: { set: [] } }
  });
  return prisma.registeredVehicle.delete({ where: { vehicle_id: vehicleId } });
};
