import { readFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import * as pdfParse from "pdf-parse";

/**
 * Извлекает текст из файла .docx
 */
export async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const fileBuffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  } catch (error) {
    throw new Error(`Ошибка при обработке DOCX файла: ${error}`);
  }
}

/**
 * Извлекает текст из файла .pdf
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const fileBuffer = await readFile(filePath);
    const data = await (pdfParse as any).default(fileBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Ошибка при обработке PDF файла: ${error}`);
  }
}

/**
 * Определяет тип файла и извлекает текст
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".docx") {
    return extractTextFromDocx(filePath);
  } else if (ext === ".pdf") {
    return extractTextFromPdf(filePath);
  } else if (ext === ".txt") {
    return readFile(filePath, "utf-8");
  } else {
    throw new Error(`Неподдерживаемый формат файла: ${ext}`);
  }
}
