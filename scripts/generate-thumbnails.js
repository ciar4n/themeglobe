#!/usr/bin/env node

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const sharp = require('sharp')

const hiresImagesFolder = path.join(__dirname, '../static/capture');
const outputFolder = path.join(__dirname, '../static/images/theme/thumbnail')
const outputFolder2x = path.join(__dirname, '../static/images/theme/thumbnail/2x')
const outputFolderFull = path.join(__dirname, '../static/images/theme/full')
const imageFiles = fs.readdirSync(hiresImagesFolder);

console.log("******************************************************")
console.log(`Generating thumbnails from images in ${hiresImagesFolder}`)
console.log("******************************************************")

imageFiles.forEach((image) => {
  const inputImage = path.join(hiresImagesFolder, image)
  const imageName = path.parse(image).name
  const outputImage = path.join(outputFolder, `${imageName}.jpg`)
  const outputImage2x = path.join(outputFolder2x, `${imageName}-2x.jpg`)
  const outputImageFull = path.join(outputFolderFull, `${imageName}.jpg`)

  if (fs.existsSync(outputImage) && fs.existsSync(outputImage2x)) {
    console.log(`skipped ${inputImage}`)
    return false
  } else {
    console.log(`processing ${inputImage}`)
    mkdirp(outputFolder);
    mkdirp(outputFolder2x);
    mkdirp(outputFolderFull);

    sharp(inputImage)
      .resize({
        width: 280,
        height: 210,
        fit: 'cover',
        position: 'top',
      })
      .jpeg({
        quality: 70,
      })
      .toFile(outputImage)
      .then((ImageResult) => {
        console.log(ImageResult);
      }).catch((err) => {
        console.log(err);
      })

    sharp(inputImage)
      .resize({
        width: 560,
        height: 420,
        fit: 'cover',
        position: 'top',
      })
      .jpeg({
        quality: 70,
      })
      .toFile(outputImage2x)
      .then((ImageResult) => {
        console.log(ImageResult);
      }).catch((err) => {
        console.log(inputImage)
        console.log(err);
      })

    sharp(inputImage)
      .resize({
        width: 1400,
        height: 1050,
        fit: 'cover',
        position: 'top',
      })
      .jpeg({
        quality: 70,
      })
      .toFile(outputImageFull)
      .then((ImageResult) => {
        console.log(ImageResult);
      }).catch((err) => {
        console.log(inputImage)
        console.log(err);
      })
  }
});
