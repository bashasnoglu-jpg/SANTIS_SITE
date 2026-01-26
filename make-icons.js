const fs = require("fs");

const { createCanvas } = require("canvas");



function makeIcon(path, size) {

  const canvas = createCanvas(size, size);

  const ctx = canvas.getContext("2d");



  // background

  ctx.fillStyle = "#1a73e8";

  ctx.fillRect(0, 0, size, size);



  // letter

  ctx.fillStyle = "#ffffff";

  ctx.font = `bold ${Math.floor(size*0.55)}px Arial`;

  ctx.textAlign = "center";

  ctx.textBaseline = "middle";

  ctx.fillText("S", size/2, size/2 + size*0.02);



  const buf = canvas.toBuffer("image/png");

  fs.writeFileSync(path, buf);

  console.log("OK ->", path, buf.length, "bytes");

}



makeIcon("images/icon-192.png", 192);

makeIcon("images/icon-512.png", 512);

makeIcon("favicon.ico", 32);


