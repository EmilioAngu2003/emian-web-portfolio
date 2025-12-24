import SVGSpriter from "svg-sprite";
import path from "path";
import fs from "fs";
import { globSync } from "glob";

const SRC_DIR = "src/icons";
const DEST_DIR = "public/sprites";

// Verificar si la carpeta de origen existe
if (!fs.existsSync(SRC_DIR)) {
  console.error(`❌ La carpeta de origen ${SRC_DIR} no existe.`);
  process.exit(1);
}

// Verificar si la carpeta de destino existe
if (!fs.existsSync(DEST_DIR)) {
  console.log(`✅ Creando carpeta de destino: ${DEST_DIR}`);
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Obtener las subcarpetas
const folders = fs.readdirSync(SRC_DIR).filter((file) => {
  const fullPath = path.join(SRC_DIR, file);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
});

// Limpieza de Sprites
const existingSprites = globSync(`${DEST_DIR}/*.svg`);

existingSprites.forEach((spriteFile) => {
  const spriteName = path.basename(spriteFile, ".svg");
  if (!folders.includes(spriteName)) {
    fs.unlinkSync(spriteFile);
    console.log(`🗑️ Sprite eliminado: ${spriteFile}`);
  }
});

// Si no hay carpetas, salir
if (folders.length === 0) {
  console.info(
    `⚠️ No se encontraron subcarpetas en ${SRC_DIR}. Saltando generación de sprites.`
  );
  process.exit(0);
}

// Generar un sprite por cada subcarpetas
folders.forEach((folder) => {
  const files = globSync(`${SRC_DIR}/${folder}/*.svg`);

  if (files.length === 0) {
    console.info(
      `⚠️ La carpeta ${folder} está vacía. Borrando sprite si existe.`
    );
    const spritePath = path.join(DEST_DIR, `${folder}.svg`);
    if (fs.existsSync(spritePath)) {
      fs.unlinkSync(spritePath);
      console.log(`🗑️ Sprite eliminado: ${spritePath}`);
    }
    return;
  }

  const spriter = new SVGSpriter({
    dest: DEST_DIR,
    mode: {
      symbol: {
        dest: ".",
        sprite: `${folder}.svg`, // El nombre del archivo será el de la carpeta
      },
    },
    shape: {
      id: { generator: (name) => path.basename(name, ".svg") }, // ID = nombre archivo
      transform: ["svgo"], // Optimiza automáticamente
    },
  });

  // Añadir todos los archivos .svg de esa carpeta
  files.forEach((file) => {
    spriter.add(path.resolve(file), null, fs.readFileSync(file, "utf-8"));
  });

  // Compilar
  spriter.compile((error, result) => {
    if (error) return console.error(error);
    for (const type in result.symbol) {
      fs.mkdirSync(DEST_DIR, { recursive: true });
      fs.writeFileSync(result.symbol[type].path, result.symbol[type].contents);
      console.log(`✅ Sprite generado: ${DEST_DIR}/${folder}.svg`);
    }
  });
});
