"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast";
// @ts-ignore - пришлось добавить ts-ignore, так как путь может быть не найден во время проверки типов
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, InfoIcon, XCircle } from "lucide-react";
import { ReactNode } from "react";

// Определяем тип для toast от хука
type ToastData = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  icon?: React.ReactNode;
  createdAt?: number; // Время создания уведомления
  duration?: number; // Длительность показа уведомления
  onOpenChange?: (open: boolean) => void; // Функция обратного вызова при изменении состояния открытия
  open?: boolean; // Состояние открытия
  [key: string]: any;
};

export function Toaster() {
  // @ts-ignore - временное игнорирование для toasts
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        icon,
        createdAt,
        duration,
        onOpenChange,
        open,
        ...props
      }: ToastData) {
        // Выбор иконки в зависимости от варианта toast
        let IconComponent: ReactNode = icon || null;
        if (!IconComponent) {
          switch (variant) {
            case "success":
              IconComponent = (
                <CheckCircle className="h-5 w-5 text-accent-600" />
              );
              break;
            case "warning":
              IconComponent = (
                <AlertCircle className="h-5 w-5 text-warning-600" />
              );
              break;
            case "destructive":
              IconComponent = <XCircle className="h-5 w-5 text-danger-600" />;
              break;
            default:
              IconComponent = <InfoIcon className="h-5 w-5 text-primary-600" />;
              break;
          }
        }

        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="flex gap-3">
              {IconComponent && (
                <div className="flex-shrink-0 pt-1">{IconComponent}</div>
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
