import * as userRepo from '../repositories/userRepository.js';

export const getProfile = async (userId: string) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new Error('User not found.');
  }
  const { password_hash: _, ...profile } = user;
  return profile;
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; birthday?: string; gender?: string }
) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const updateData: { name?: string; birthday?: Date | null; gender?: string | null } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.birthday !== undefined) updateData.birthday = data.birthday ? new Date(data.birthday) : null;
  if (data.gender !== undefined) updateData.gender = data.gender || null;

  const updated = await userRepo.updateUser(userId, updateData);
  const { password_hash: _, ...profile } = updated;
  return profile;
};
