import { getChannel, QUEUES } from './connection.js';

export const sendGateCommand = async (gateId: string, command: 'OPEN' | 'CLOSE') => {
  const channel = getChannel();

  const message = JSON.stringify({
    gateId,
    command,
    timestamp: new Date().toISOString()
  });

  channel.sendToQueue(QUEUES.GATE_COMMANDS, Buffer.from(message), { persistent: true });
  console.log(`Sent Gate Command: ${command} to ${gateId}`);
};