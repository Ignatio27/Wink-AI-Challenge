import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Mock данные сценария с проблемными фрагментами
const mockScenario = {
  title: "Пример сценария",
  scenes: [
    {
      id: 1,
      number: "СЦЕНА 1. ИНТЕРЬЕР. БАР - ВЕЧЕР",
      content: [
        { text: "Джон входит в полутемный бар. За стойкой стоит бармен, протирая стаканы.", type: "normal" },
        { text: "Джон подходит к стойке и заказывает виски.", type: "issue", category: "Алкоголь", reason: "Упоминание алкоголя" },
        { text: "Бармен наливает напиток, Джон делает большой глоток.", type: "issue", category: "Алкоголь", reason: "Употребление алкоголя" }
      ]
    },
    {
      id: 2,
      number: "СЦЕНА 2. ИНТЕРЬЕР. БАР - ПРОДОЛЖЕНИЕ",
      content: [
        { text: "В бар входит Майк, явно разозленный. Он направляется прямо к Джону.", type: "normal" },
        { text: "Майк хватает Джона за воротник и с силой толкает его к стене.", type: "issue", category: "Насилие", reason: "Физическое насилие" },
        { text: "— Ты чертов идиот! — кричит Майк.", type: "issue", category: "Ненормативная лексика", reason: "Оскорбления" },
        { text: "Джон пытается вырваться, но Майк наносит ему удар в живот.", type: "issue", category: "Насилие", reason: "Физическое насилие" }
      ]
    },
    {
      id: 3,
      number: "СЦЕНА 3. ИНТЕРЬЕР. БАР - ПРОДОЛЖЕНИЕ",
      content: [
        { text: "Бармен вызывает охрану. Два крепких парня разнимают дерущихся.", type: "normal" },
        { text: "— Убирайтесь оба к черту отсюда! — кричит бармен.", type: "issue", category: "Ненормативная лексика", reason: "Грубая лексика" },
        { text: "Джон и Майк выходят на улицу, продолжая перебрасываться угрозами.", type: "normal" }
      ]
    },
    {
      id: 4,
      number: "СЦЕНА 4. ЭКСТЕРЬЕР. УЛИЦА - ВЕЧЕР",
      content: [
        { text: "На улице Джон и Майк останавливаются, тяжело дыша.", type: "normal" },
        { text: "— Слушай, я не хотел, чтобы все так вышло, — говорит Джон.", type: "normal" },
        { text: "Майк молча смотрит на него, затем кивает.", type: "normal" },
        { text: "Они пожимают руки и расходятся в разные стороны.", type: "normal" }
      ]
    }
  ]
};

const categoryColors: Record<string, string> = {
  "Насилие": "bg-red-500/20 text-red-400 border-red-500/50",
  "Ненормативная лексика": "bg-orange-500/20 text-orange-400 border-orange-500/50",
  "Алкоголь": "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  "Сексуальный контекст": "bg-purple-500/20 text-purple-400 border-purple-500/50"
};

export default function Editor() {
  const [, setLocation] = useLocation();
  const [fileName, setFileName] = useState<string>("");
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<{ category: string; reason: string } | null>(null);

  useEffect(() => {
    const storedFileName = sessionStorage.getItem("scenarioFile");
    if (!storedFileName) {
      setLocation("/");
      return;
    }
    setFileName(storedFileName);
  }, [setLocation]);

  const handleIssueClick = (category: string, reason: string) => {
    setSelectedIssue({ category, reason });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient-orange">
                Редактор сценария
              </h1>
              <p className="text-muted-foreground mt-2">
                Файл: {fileName}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAnnotationModal(true)}
                className="hover:bg-primary/10 hover:border-primary transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Аннотация
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/result")}
                className="hover:bg-primary/10 hover:border-primary transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Info Banner */}
          <div className="glass-card rounded-xl p-6 border-primary animate-fade-in glow-orange">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  Проблемные фрагменты выделены
                </h3>
                <p className="text-sm text-muted-foreground">
                  Красным цветом отмечены фрагменты текста, которые повлияли на возрастной рейтинг. 
                  Нажмите на выделенный текст для получения подробной информации.
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 animate-slide-in">
            <span className="text-sm text-muted-foreground">Категории:</span>
            {Object.entries(categoryColors).map(([category, colorClass]) => (
              <Badge key={category} className={`${colorClass} border`}>
                {category}
              </Badge>
            ))}
          </div>

          {/* Scenario Content */}
          <div className="space-y-6">
            {mockScenario.scenes.map((scene) => (
              <div
                key={scene.id}
                className="glass-card rounded-xl p-8 animate-fade-in hover:glow-orange transition-all duration-300"
              >
                <h2 className="text-xl font-bold mb-6 text-primary">
                  {scene.number}
                </h2>
                <div className="space-y-4">
                  {scene.content.map((line, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {line.type === "issue" ? (
                        <div className="flex-1 flex items-start gap-2">
                          <p className="flex-1 text-foreground leading-relaxed">
                            <span
                              className="bg-red-500/20 border-l-4 border-red-500 pl-3 py-1 inline-block cursor-pointer hover:bg-red-500/30 transition-colors"
                              onClick={() => handleIssueClick(line.category!, line.reason!)}
                            >
                              {line.text}
                            </span>
                          </p>
                          <Badge
                            className={`${categoryColors[line.category!]} border text-xs flex-shrink-0 cursor-pointer`}
                            onClick={() => handleIssueClick(line.category!, line.reason!)}
                          >
                            {line.category}
                          </Badge>
                        </div>
                      ) : (
                        <p className="flex-1 text-muted-foreground leading-relaxed">
                          {line.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Statistics */}
          <div className="glass-card rounded-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Статистика проблемных фрагментов
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-400 mb-2">2</div>
                <p className="text-sm text-muted-foreground">Насилие</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">2</div>
                <p className="text-sm text-muted-foreground">Ненормативная лексика</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400 mb-2">2</div>
                <p className="text-sm text-muted-foreground">Алкоголь</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Issue Detail Popup */}
      {selectedIssue && (
        <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="glass-card border-primary glow-orange">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Детали проблемы
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Информация о выявленном фрагменте
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Категория
                </h3>
                <Badge className={`${categoryColors[selectedIssue.category]} border`}>
                  {selectedIssue.category}
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Причина
                </h3>
                <p className="text-foreground">{selectedIssue.reason}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  Рекомендация
                </h3>
                <p className="text-sm text-muted-foreground">
                  Рекомендуется смягчить или удалить данный фрагмент для понижения возрастного рейтинга.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Annotation Modal */}
      <Dialog open={showAnnotationModal} onOpenChange={setShowAnnotationModal}>
        <DialogContent className="glass-card border-primary glow-orange max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Аннотация и рекомендации
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Автоматически сгенерированные рекомендации по улучшению сценария
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Общая оценка
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Сценарий содержит несколько проблемных элементов, которые повышают возрастной рейтинг до 16+. 
                Основные проблемы связаны с изображением насилия и использованием ненормативной лексики.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Рекомендации по улучшению
              </h3>
              <div className="space-y-3">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-400 mb-1">Насилие</h4>
                  <p className="text-sm text-muted-foreground">
                    Смягчите описание физических конфликтов. Вместо детального описания ударов, 
                    сосредоточьтесь на эмоциональных последствиях конфликта.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-400 mb-1">Ненормативная лексика</h4>
                  <p className="text-sm text-muted-foreground">
                    Замените грубые выражения на более мягкие литературные аналоги. 
                    Это значительно снизит возрастной рейтинг.
                  </p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-yellow-400 mb-1">Алкоголь</h4>
                  <p className="text-sm text-muted-foreground">
                    Минимизируйте акцент на употреблении алкоголя. Можно упомянуть напиток, 
                    но избегайте детального описания процесса употребления.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
              <p className="text-sm text-foreground">
                <strong>Прогноз:</strong> При внесении предложенных изменений возрастной рейтинг 
                может быть снижен до <strong className="text-primary">12+</strong> или <strong className="text-primary">6+</strong>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
