import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { spawn } from "child_process";
import path from "path";
import { generateDocxReport, generatePdfReport } from "./reportGenerator";
import { tmpdir } from "os";

// Mock функция для анализа сценария (fallback)
function analyzeMock(content: string) {
  const content_lower = content.toLowerCase();
  
  let rating = "OK";
  let categories: string[] = [];
  let comment = "Содержимое безопасно для всех возрастов";
  
  // Проверка на мат
  const profanity_words = ["блядь", "блять", "сука", "хуй", "пизда", "ебать", "ебал", "нахуй"];
  if (profanity_words.some(word => content_lower.includes(word))) {
    rating = "18+";
    categories.push("profanity");
    comment = "Обнаружена ненормативная лексика";
  }
  
  // Проверка на насилие
  const violence_words = ["убийство", "убить", "кровь", "труп", "избиение", "пытки"];
  if (violence_words.some(word => content_lower.includes(word))) {
    if (rating !== "18+") {
      rating = "18+";
      categories = [];
    }
    categories.push("violence");
    comment = "Обнаружены сцены насилия";
  }
  
  // Проверка на опасность
  const danger_words = ["погоня", "преследование", "оружие", "угроза"];
  if (danger_words.some(word => content_lower.includes(word)) && rating === "OK") {
    rating = "16+";
    categories.push("danger");
    comment = "Присутствуют опасные ситуации";
  }
  
  // Проверка на лёгкий конфликт
  const conflict_words = ["спор", "ссора", "конфликт", "обида"];
  if (conflict_words.some(word => content_lower.includes(word)) && rating === "OK") {
    rating = "12+";
    categories.push("mild_conflict");
    comment = "Присутствуют лёгкие конфликтные ситуации";
  }
  
  return {
    rating,
    categories,
    comment,
    scenes: [
      {
        scene_id: 1,
        content: content.length > 200 ? content.substring(0, 200) + "..." : content,
        rating,
        categories,
        issues: categories.length > 0 ? [
          {
            line: 1,
            text: content.split("\n")[0] || content.substring(0, 100),
            category: categories[0],
            severity: rating === "18+" ? "high" : rating === "16+" || rating === "12+" ? "medium" : "low"
          }
        ] : []
      }
    ]
  };
}

export const scenarioRouter = router({
  analyze: publicProcedure
    .input(
      z.object({
        content: z.string().min(1, "Содержимое сценария не может быть пустым"),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return new Promise((resolve, reject) => {
        const pythonScript = path.join(process.cwd(), "server", "llm_classifier.py");
        
        const python = spawn("python3", [pythonScript], {
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 30000,
        });
        
        let outputData = "";
        let errorData = "";
        let hasError = false;
        
        const inputJson = JSON.stringify({ content: input.content });
        python.stdin.write(inputJson);
        python.stdin.end();
        
        python.stdout.on("data", (data) => {
          outputData += data.toString();
        });
        
        python.stderr.on("data", (data) => {
          errorData += data.toString();
          hasError = true;
        });
        
        python.on("error", (err) => {
          console.error("Failed to spawn Python process:", err);
          // Fallback на mock результат
          console.log("Using mock analysis as fallback");
          resolve(analyzeMock(input.content));
        });
        
        python.on("close", (code) => {
          // Если есть ошибка или код не 0, используем mock
          if (code !== 0 || hasError || !outputData) {
            console.error("Python script error (code " + code + "):", errorData);
            console.log("Using mock analysis as fallback");
            resolve(analyzeMock(input.content));
            return;
          }
          
          try {
            const result = JSON.parse(outputData);
            if (result.error) {
              console.log("Using mock analysis as fallback");
              resolve(analyzeMock(input.content));
              return;
            }
            resolve(result);
          } catch (e) {
            console.error("Failed to parse Python output:", outputData, "Error:", e);
            console.log("Using mock analysis as fallback");
            resolve(analyzeMock(input.content));
          }
        });
      });
    }),

  exportReport: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        format: z.enum(["docx", "pdf"]),
        analysisResult: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const tempDir = tmpdir();
        const timestamp = Date.now();
        const baseFileName = input.fileName.replace(/\.[^/.]+$/, "");
        const outputFileName = `${baseFileName}_report_${timestamp}.${input.format}`;
        const outputPath = path.join(tempDir, outputFileName);

        if (input.format === "docx") {
          await generateDocxReport(input.fileName, input.analysisResult, outputPath);
        } else if (input.format === "pdf") {
          await generatePdfReport(input.fileName, input.analysisResult, outputPath);
        }

        return {
          success: true,
          fileName: outputFileName,
          path: outputPath,
        };
      } catch (error) {
        throw new Error(`Ошибка экспорта: ${error}`);
      }
    }),
});
