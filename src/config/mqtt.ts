import mqtt from 'mqtt';

const MQTT_URL = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org';
export const mqttClient = mqtt.connect(MQTT_URL);