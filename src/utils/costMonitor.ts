// src/utils/costMonitor.ts
export interface CostMonitorUsage {
  operationsToday: number;
  remaining: number;
  percentage: number;
}

class CostMonitor {
  private static operationsCount: number = 0;
  private static readonly maxOperationsPerDay: number = 1000; // Límite conservador

  /**
   * Registra una operación y verifica los límites
   */
  static trackOperation(): void {
    this.operationsCount++;
    
    if (this.operationsCount > this.maxOperationsPerDay * 0.8) {
      console.warn('⚠️ Acercándose al límite diario de operaciones');
    }

    if (this.operationsCount >= this.maxOperationsPerDay) {
      console.error('🚨 Límite diario de operaciones alcanzado');
    }
  }

  /**
   * Obtiene el uso actual y estadísticas
   */
  static getUsage(): CostMonitorUsage {
    const percentage = (this.operationsCount / this.maxOperationsPerDay) * 100;
    
    return {
      operationsToday: this.operationsCount,
      remaining: this.maxOperationsPerDay - this.operationsCount,
      percentage: parseFloat(percentage.toFixed(2)) // Redondear a 2 decimales
    };
  }

  /**
   * Reinicia el contador de operaciones
   */
  static resetCounter(): void {
    this.operationsCount = 0;
    console.log('🔄 Contador de operaciones reiniciado');
  }

  /**
   * Verifica si se ha excedido el límite
   */
  static isLimitExceeded(): boolean {
    return this.operationsCount >= this.maxOperationsPerDay;
  }

  /**
   * Obtiene el límite máximo configurado
   */
  static getLimit(): number {
    return this.maxOperationsPerDay;
  }

  /**
   * Establece un nuevo límite (útil para testing)
   */
  static setLimit(newLimit: number): void {
    if (newLimit > 0) {
      this.maxOperationsPerDay = newLimit;
      console.log(`📊 Nuevo límite establecido: ${newLimit} operaciones/día`);
    } else {
      console.error('❌ El límite debe ser mayor a 0');
    }
  }
}

export default CostMonitor;