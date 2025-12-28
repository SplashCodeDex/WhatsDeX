import fs from 'fs';
import { spawn } from 'child_process';

export const imageToWebp = async buffer => {
  return buffer;
};

export const videoToWebp = async buffer => {
  return buffer;
};

export const writeExifImg = async (buffer, metadata) => {
  return buffer;
};

export const writeExifVid = async (buffer, metadata) => {
  return buffer;
};

export const writeExif = writeExifImg;

export default {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
  writeExif,
};
