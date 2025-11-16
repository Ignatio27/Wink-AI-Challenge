import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Home() {

  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const isValidType = 
        droppedFile.type === "text/plain" || 
        droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        droppedFile.type === "application/pdf" ||
        droppedFile.name.endsWith(".txt") ||
        droppedFile.name.endsWith(".docx") ||
        droppedFile.name.endsWith(".pdf");
      
      if (isValidType) {
        setFile(droppedFile);
        toast.success("Файл загружен успешно!");
      } else {
        toast.error("Пожалуйста, загрузите файл в формате .txt, .docx или .pdf");
      }
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isValidType = 
        selectedFile.type === "text/plain" || 
        selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selectedFile.type === "application/pdf" ||
        selectedFile.name.endsWith(".txt") ||
        selectedFile.name.endsWith(".docx") ||
        selectedFile.name.endsWith(".pdf");
      
      if (isValidType) {
        setFile(selectedFile);
        toast.success("Файл загружен успешно!");
      } else {
        toast.error("Пожалуйста, загрузите файл в формате .txt, .docx или .pdf");
      }
    }
  }, []);

  const analyzeMutation = trpc.scenario.analyze.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      // Сохраняем результаты для страницы результатов
      sessionStorage.setItem("scenarioFile", file?.name || "scenario.txt");
      sessionStorage.setItem("scenarioResult", JSON.stringify(data));
      setLocation("/result");
      toast.success("Анализ завершён!");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Ошибка анализа: ${error.message}`);
    },
  });

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      toast.error("Сначала загрузите файл сценария");
      return;
    }

    setIsAnalyzing(true);
    
    // Читаем содержимое файла
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        analyzeMutation.mutate({ content });
      } else {
        setIsAnalyzing(false);
        toast.error("Не удалось прочитать файл");
      }
    };
    reader.onerror = () => {
      setIsAnalyzing(false);
      toast.error("Ошибка чтения файла");
    };
    reader.readAsText(file);
  }, [file, analyzeMutation]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-gradient-orange">
            Проверка возрастного рейтинга сценариев
          </h1>
          <p className="text-muted-foreground mt-2">
            Загрузите сценарий для автоматического определения возрастного рейтинга
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Area */}
          <div className="animate-fade-in">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                glass-card rounded-2xl p-12 transition-all duration-300
                ${isDragging ? "glow-orange-strong scale-[1.02]" : "glow-orange"}
                ${file ? "border-primary" : ""}
              `}
            >
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  {file ? (
                    <FileText className="w-12 h-12 text-primary" />
                  ) : (
                    <Upload className="w-12 h-12 text-primary" />
                  )}
                </div>

                {file ? (
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Файл загружен
                    </h3>
                    <p className="text-muted-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Перетащите файл сюда
                    </h3>
                    <p className="text-muted-foreground">
                      или нажмите кнопку ниже для выбора файла
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Поддерживаются файлы (.txt, .docx, .pdf)
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <label htmlFor="file-input">
                    <Button
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-all"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {file ? "Выбрать другой файл" : "Выбрать файл"}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".txt,.docx,.pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  {file && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground glow-orange transition-all"
                    >
                      {isAnalyzing ? "Анализ..." : "Проверить сценарий"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 animate-slide-in">
            <div className="glass-card rounded-xl p-6 hover:glow-orange transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Загрузите сценарий
              </h3>
              <p className="text-sm text-muted-foreground">
                Выберите текстовый файл с вашим сценарием для анализа
              </p>
            </div>

            <div className="glass-card rounded-xl p-6 hover:glow-orange transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Получите результат
              </h3>
              <p className="text-sm text-muted-foreground">
                Система автоматически определит возрастной рейтинг
              </p>
            </div>

            <div className="glass-card rounded-xl p-6 hover:glow-orange transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Редактируйте текст
              </h3>
              <p className="text-sm text-muted-foreground">
                Просмотрите проблемные фрагменты и получите рекомендации
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Система автоматической проверки возрастного рейтинга сценариев
        </div>
      </footer>
    </div>
  );
}
