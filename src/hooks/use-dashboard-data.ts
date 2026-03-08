import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { seedIfEmpty } from '@/lib/db';
import { UTILITIES, type UtilityType } from '@/types/utility';
import { spaces, clients } from '@/data/mockData';

export interface DashboardPeriodData {
  period: string;
  totalNetValue: number;
  totalVatValue: number;
  totalValue: number;
  byUtility: {
    utilityType: UtilityType;
    consumption: number;
    netValue: number;
    vatValue: number;
    totalValue: number;
  }[];
  byClient: {
    clientId: string;
    clientName: string;
    clientType: string;
    byUtility: Record<UtilityType, number>;
    total: number;
  }[];
  activeClients: number;
  occupiedSpaces: number;
}

export function useDashboardData() {
  const [ready, setReady] = useState(false);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [periodData, setPeriodData] = useState<DashboardPeriodData | null>(null);
  const [chartData, setChartData] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    seedIfEmpty().then(async () => {
      const dists = await db.distributions.toArray();
      const allPeriods = [...new Set(dists.map(d => d.period))] as string[];
      allPeriods.sort().reverse();
      setPeriods(allPeriods);
      if (allPeriods.length > 0) {
        setSelectedPeriod(allPeriods[0]);
      }

      // Build chart data for all periods
      const chart: Record<string, Record<string, number>> = {};
      for (const d of dists) {
        if (!chart[d.period]) chart[d.period] = {};
        chart[d.period][d.utilityType] = (chart[d.period][d.utilityType] || 0) + d.totalValue;
      }
      setChartData(chart);
      setReady(true);
    });
  }, []);

  const loadPeriod = useCallback(async (period: string) => {
    const dists = await db.distributions.where('period').equals(period).toArray();

    // By utility
    const byUtility = UTILITIES.map(u => {
      const uDists = dists.filter(d => d.utilityType === u.id);
      return {
        utilityType: u.id,
        consumption: uDists.reduce((s, d) => s + d.consumption, 0),
        netValue: uDists.reduce((s, d) => s + d.netValue, 0),
        vatValue: uDists.reduce((s, d) => s + d.vatValue, 0),
        totalValue: uDists.reduce((s, d) => s + d.totalValue, 0),
      };
    }).filter(u => u.totalValue > 0 || u.consumption > 0);

    // By client
    const clientIds = [...new Set(dists.map(d => d.clientId))] as string[];
    const byClient = clientIds.map(cid => {
      const client = clients.find(c => c.id === cid);
      const cDists = dists.filter(d => d.clientId === cid);
      const byUt = UTILITIES.reduce((acc, u) => {
        acc[u.id] = cDists.filter(d => d.utilityType === u.id).reduce((s, d) => s + d.totalValue, 0);
        return acc;
      }, {} as Record<UtilityType, number>);
      return {
        clientId: cid,
        clientName: client?.name || 'Necunoscut',
        clientType: client?.type || 'PJ',
        byUtility: byUt,
        total: cDists.reduce((s, d) => s + d.totalValue, 0),
      };
    }).sort((a, b) => b.total - a.total);

    const totalNetValue = dists.reduce((s, d) => s + d.netValue, 0);
    const totalVatValue = dists.reduce((s, d) => s + d.vatValue, 0);
    const totalValue = dists.reduce((s, d) => s + d.totalValue, 0);

    // Count active clients and occupied spaces for this period
    const activeClients = clientIds.length;
    const occupiedSpaceIds = [...new Set(dists.map(d => d.spaceId))];

    setPeriodData({
      period,
      totalNetValue,
      totalVatValue,
      totalValue,
      byUtility,
      byClient,
      activeClients,
      occupiedSpaces: occupiedSpaceIds.length,
    });
  }, []);

  useEffect(() => {
    if (selectedPeriod && ready) {
      loadPeriod(selectedPeriod);
    }
  }, [selectedPeriod, ready, loadPeriod]);

  return {
    ready,
    periods,
    selectedPeriod,
    setSelectedPeriod,
    periodData,
    chartData,
  };
}
