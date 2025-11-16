import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FileEdit, Sparkles, AlertTriangle, Ban, Skull, Wine, MessageSquareWarning, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Result() {
  const [, setLocation] = useLocation();
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportMutation = trpc.scenario.exportReport.useMutation({
    onSuccess: () => {
      setIsExporting(false);
      toast.success("Отчет успешно экспортирован!");
    },
    onError: (error: any) => {
      setIsExporting(false);
      toast.error(`Ошибка экспорта: ${error.message}`);
    },
  });

  useEffect(() => {
    const storedFileName = sessionStorage.getItem("scenarioFile");
    const storedResult = sessionStorage.getItem("scenarioResult");
    
    if (!storedFileName || !storedResult) {
      setLocation("/");
      return;
    }
    
    setFileName(storedFileName);
    try {
      setResult(JSON.parse(storedResult));
    } catch (e) {
      console.error("Failed to parse result", e);
      setLocation("/");
    }
  }, [setLocation]);

  const categories = useMemo(() => {
    if (!result || !result.categories) return [];
    
    const categoryInfo: Record<string, { name: string; icon: any; color: string }> = {
      violence: { name: "Насилие", icon: Skull, color: "text-red-500" },
      profanity: { name: "Ненормативная лексика", icon: Ban, color: "text-orange-500" },
      danger: { name: "Опасные ситуации", icon: AlertTriangle, color: "text-yellow-500" },
      gore: { name: "Жестокость", icon: Skull, color: "text-red-600" },
      sexual_content: { name: "Сексуальный контент", icon: MessageSquareWarning, color: "text-pink-500" },
      suicide: { name: "Суицид", icon: Skull, color: "text-red-700" },
      child_abuse: { name: "Жестокость к детям", icon: AlertTriangle, color: "text-red-800" },
      crime: { name: "Преступления", icon: AlertTriangle, color: "text-orange-600" },
      stress: { name: "Стресс", icon: AlertTriangle, color: "text-yellow-600" },
      mild_conflict: { name: "Лёгкий конфликт", icon: MessageSquareWarning, color: "text-yellow-400" },
      mild_emotion: { name: "Лёгкие эмоции", icon: MessageSquareWarning, color: "text-green-500" },
      mild_injury: { name: "Лёгкие травмы", icon: AlertTriangle, color: "text-yellow-500" },
    };
    
    const getLevel = (category: string) => {
      if (["violence", "profanity", "gore", "sexual_content", "suicide", "child_abuse"].includes(category)) {
        return "Высокий";
      }
      if (["danger", "crime", "stress"].includes(category)) {
        return "Средний";
      }
      return "Низкий";
    };
    
    return result.categories.map((cat: string) => {
      const info = categoryInfo[cat] || { name: cat, icon: AlertTriangle, color: "text-gray-500" };
      const count = result.scenes?.[0]?.issues?.filter((i: any) => i.category === cat).length || 1;
      return {
        name: info.name,
        level: getLevel(cat),
        count,
        icon: info.icon,
        color: info.color,
      };
    });
  }, [result]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "0+":
      case "OK":
      case "6+":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "12+":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "16+":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "18+":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleGetAnnotation = () => {
    setShowAnnotation(true);
    setTimeout(() => setShowAnnotation(false), 5000);
  };

  const handleOpenEditor = () => {
    if (result && result.scenes && result.scenes[0]) {
      sessionStorage.setItem("editorData", JSON.stringify(result.scenes[0]));
    }
    setLocation("/editor");
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-orange">
                Результаты анализа
              </h1>
              <p className="text-muted-foreground mt-2">
                Файл: {fileName}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="hover:bg-primary/10 hover:border-primary transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Rating Card */}
          <div className="glass-card rounded-2xl p-8 glow-orange-strong animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Возрастной рейтинг
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <div className={`text-6xl font-bold px-8 py-4 rounded-2xl border-2 ${getRatingColor(result.rating)}`}>
                    {result.rating}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{result.comment}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleOpenEditor}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground glow-orange transition-all"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Открыть редактор
                </Button>
                <Button
                  onClick={handleGetAnnotation}
                  variant="outline"
                  className="hover:bg-primary/10 hover:border-primary transition-all"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Получить аннотацию
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsExporting(true);
                      exportMutation.mutate({
                        fileName,
                        format: "docx",
                        analysisResult: result,
                      });
                    }}
                    disabled={isExporting}
                    variant="outline"
                    className="flex-1 hover:bg-primary/10 hover:border-primary transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    DOCX
                  </Button>
                  <Button
                    onClick={() => {
                      setIsExporting(true);
                      exportMutation.mutate({
                        fileName,
                        format: "pdf",
                        analysisResult: result,
                      });
                    }}
                    disabled={isExporting}
                    variant="outline"
                    className="flex-1 hover:bg-primary/10 hover:border-primary transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Annotation Alert */}
          {showAnnotation && (
            <div className="glass-card rounded-xl p-6 border-primary animate-fade-in glow-orange">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    Рекомендации по улучшению
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Для понижения возрастного рейтинга рекомендуется:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {categories.map((cat: any, idx: number) => (
                      <li key={idx}>• Смягчить или удалить: {cat.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Categories Grid */}
          {categories.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">
                Категории нарушений
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in">
                {categories.map((category: any, index: number) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={index}
                      className="glass-card rounded-xl p-6 hover:glow-orange transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Icon className={`w-8 h-8 ${category.color}`} />
                        <Badge variant="secondary" className="text-xs">
                          {category.count} шт.
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {category.name}
                      </h3>
                      <p className={`text-sm font-medium ${category.color}`}>
                        Уровень: {category.level}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Analysis */}
          {categories.length > 0 && (
            <div className="glass-card rounded-xl p-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 text-foreground">
                Подробный анализ
              </h2>
              <div className="space-y-4">
                {categories.map((category: any, index: number) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-2">
                      {category.name} ({category.count} фрагментов)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Обнаружены элементы категории "{category.name}". 
                      Рекомендуется пересмотреть содержание для понижения рейтинга.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
