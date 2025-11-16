import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, BorderStyle, WidthType, AlignmentType, HeadingLevel } from "docx";
import { writeFile } from "fs/promises";
import path from "path";

interface AnalysisResult {
  rating: string;
  categories: string[];
  comment: string;
  scenes?: Array<{
    content: string;
    issues?: Array<{
      line: number;
      text: string;
      category: string;
      severity: string;
    }>;
  }>;
}

/**
 * Генерирует отчет в формате DOCX
 */
export async function generateDocxReport(
  fileName: string,
  analysisResult: AnalysisResult,
  outputPath: string
): Promise<void> {
  const categoryNames: Record<string, string> = {
    violence: "Насилие",
    profanity: "Ненормативная лексика",
    danger: "Опасные ситуации",
    gore: "Жестокость",
    sexual_content: "Сексуальный контент",
    suicide: "Суицид",
    child_abuse: "Жестокость к детям",
    crime: "Преступления",
    stress: "Стресс",
    mild_conflict: "Лёгкий конфликт",
    mild_emotion: "Лёгкие эмоции",
    mild_injury: "Лёгкие травмы",
  };

  const doc = new Document({
    sections: [
      {
        children: [
          // Заголовок
          new Paragraph({
            text: "Отчет о проверке возрастного рейтинга сценария",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Информация о файле
          new Paragraph({
            text: `Файл: ${fileName}`,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: `Дата анализа: ${new Date().toLocaleString("ru-RU")}`,
            spacing: { after: 400 },
          }),

          // Результат рейтинга
          new Paragraph({
            text: "Результат анализа",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Возрастной рейтинг: ${analysisResult.rating}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            text: analysisResult.comment,
            spacing: { after: 400 },
          }),

          // Категории нарушений
          ...(analysisResult.categories.length > 0
            ? [
                new Paragraph({
                  text: "Обнаруженные категории нарушений",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { after: 200 },
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph("Категория")],
                          shading: { fill: "D3D3D3" },
                        }),
                        new TableCell({
                          children: [new Paragraph("Количество")],
                          shading: { fill: "D3D3D3" },
                        }),
                      ],
                    }),
                    ...analysisResult.categories.map(
                      (cat) =>
                        new TableRow({
                          children: [
                            new TableCell({
                              children: [new Paragraph(categoryNames[cat as keyof typeof categoryNames] || cat)],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                            }),
                            new TableCell({
                              children: [
                                new Paragraph(
                                  (
                                    analysisResult.scenes?.[0]?.issues?.filter((i) => i.category === cat)
                                      .length || 1
                                  ).toString()
                                ),
                              ],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                            }),
                          ],
                        })
                    ),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 400 } }),
              ]
            : []),

          // Рекомендации
          new Paragraph({
            text: "Рекомендации по улучшению",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Для понижения возрастного рейтинга рекомендуется:",
            spacing: { after: 200 },
          }),

          ...analysisResult.categories.map(
            (cat) =>
              new Paragraph({
                text: `• ${categoryNames[cat as keyof typeof categoryNames] || cat}: Пересмотрите содержание данной категории`,
                spacing: { after: 100 },
                indent: { left: 400 },
              })
          ),

          new Paragraph({
            text: "",
            spacing: { after: 400 },
          }),

          // Подробный анализ
          ...(analysisResult.scenes?.[0]?.issues && analysisResult.scenes[0].issues.length > 0
            ? [
                new Paragraph({
                  text: "Подробный анализ проблемных фрагментов",
                  heading: HeadingLevel.HEADING_2,
                  spacing: { after: 200 },
                }),
                ...analysisResult.scenes[0].issues.map(
                  (issue) =>
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `[${issue.category}] `,
                          bold: true,
                        }),
                        new TextRun({
                          text: issue.text,
                        }),
                      ],
                      spacing: { after: 100 },
                      indent: { left: 400 },
                    })
                ),
              ]
            : []),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  await writeFile(outputPath, buffer);
}

/**
 * Генерирует отчет в формате PDF (текстовый формат)
 */
export async function generatePdfReport(
  fileName: string,
  analysisResult: AnalysisResult,
  outputPath: string
): Promise<void> {
  const categoryNames: Record<string, string> = {
    violence: "Насилие",
    profanity: "Ненормативная лексика",
    danger: "Опасные ситуации",
    gore: "Жестокость",
    sexual_content: "Сексуальный контент",
    suicide: "Суицид",
    child_abuse: "Жестокость к детям",
    crime: "Преступления",
    stress: "Стресс",
    mild_conflict: "Лёгкий конфликт",
    mild_emotion: "Лёгкие эмоции",
    mild_injury: "Лёгкие травмы",
  };

  let pdfContent = "";

  pdfContent += "═══════════════════════════════════════════════════════════════\n";
  pdfContent += "   ОТЧЕТ О ПРОВЕРКЕ ВОЗРАСТНОГО РЕЙТИНГА СЦЕНАРИЯ\n";
  pdfContent += "═══════════════════════════════════════════════════════════════\n\n";

  pdfContent += `Файл: ${fileName}\n`;
  pdfContent += `Дата анализа: ${new Date().toLocaleString("ru-RU")}\n\n`;

  pdfContent += "───────────────────────────────────────────────────────────────\n";
  pdfContent += "РЕЗУЛЬТАТ АНАЛИЗА\n";
  pdfContent += "───────────────────────────────────────────────────────────────\n\n";

  pdfContent += `Возрастной рейтинг: ${analysisResult.rating}\n`;
  pdfContent += `${analysisResult.comment}\n\n`;

  if (analysisResult.categories.length > 0) {
    pdfContent += "───────────────────────────────────────────────────────────────\n";
    pdfContent += "ОБНАРУЖЕННЫЕ КАТЕГОРИИ НАРУШЕНИЙ\n";
    pdfContent += "───────────────────────────────────────────────────────────────\n\n";

    analysisResult.categories.forEach((cat) => {
      const count = analysisResult.scenes?.[0]?.issues?.filter((i) => i.category === cat).length || 1;
      pdfContent += `• ${categoryNames[cat as keyof typeof categoryNames] || cat}: ${count} фрагментов\n`;
    });

    pdfContent += "\n";
  }

  pdfContent += "───────────────────────────────────────────────────────────────\n";
  pdfContent += "РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ\n";
  pdfContent += "───────────────────────────────────────────────────────────────\n\n";

  pdfContent += "Для понижения возрастного рейтинга рекомендуется:\n\n";

  analysisResult.categories.forEach((cat) => {
    pdfContent += `• ${categoryNames[cat as keyof typeof categoryNames] || cat}: Пересмотрите содержание данной категории\n`;
  });

  if (analysisResult.scenes?.[0]?.issues && analysisResult.scenes[0].issues.length > 0) {
    pdfContent += "\n───────────────────────────────────────────────────────────────\n";
    pdfContent += "ПОДРОБНЫЙ АНАЛИЗ ПРОБЛЕМНЫХ ФРАГМЕНТОВ\n";
    pdfContent += "───────────────────────────────────────────────────────────────\n\n";

    analysisResult.scenes[0].issues.forEach((issue) => {
      pdfContent += `[${issue.category}] ${issue.text}\n`;
    });
  }

  pdfContent += "\n═══════════════════════════════════════════════════════════════\n";
  pdfContent += `Конец отчета\n`;
  pdfContent += "═══════════════════════════════════════════════════════════════\n";

  await writeFile(outputPath, pdfContent, "utf-8");
}
