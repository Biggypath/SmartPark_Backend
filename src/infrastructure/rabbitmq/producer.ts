import { getChannel } from './connection.js';

export const sendGateCommand = async (gateId: string, command: 'OPEN' | 'CLOSE') => {
  const channel = getChannel();
  const queue = 'gate_commands';

  const message = JSON.stringify({
    gateId,
    command,
    timestamp: new Date().toISOString()
  });

  channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
  console.log(`🚀 Sent Command: ${command} to ${gateId}`);
};