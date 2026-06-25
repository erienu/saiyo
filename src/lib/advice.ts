import type { ChannelStat, HealthScoreResult, LeadTimeStat } from './metrics';

/**
 * ヘルススコアが黄色/赤信号のときに、データから読み取れる要因に基づいて
 * 打つべき対策をルールベースで生成する(外部AI API呼び出しは行わない)。
 */
export function generateHealthScoreAdvice(
  health: HealthScoreResult,
  leadTimes: LeadTimeStat[],
  channelStats: ChannelStat[]
): string[] {
  if (health.signal === 'green') return [];

  const advice: string[] = [];
  const shortfall = Math.max(0, Math.round((health.expectedByNow - health.actualCount) * 10) / 10);

  if (shortfall > 0) {
    advice.push(
      `現時点(経過${health.elapsedPercent}%)で目標ペースに対し約${shortfall}件不足しています。このペースが続くと期間終了時点で目標(${health.targetCount}件)に届かない見込みです。`
    );
  }

  const docScreenToInterview = leadTimes.find(
    (l) => l.toStage === 'カジュアル面談' || l.toStage === '1次面接'
  );
  if (docScreenToInterview && docScreenToInterview.avgDays !== null && docScreenToInterview.avgDays > 5) {
    advice.push(
      `書類選考から面談設定までの平均リードタイムが${docScreenToInterview.avgDays}日と長めです。候補者への連絡・日程調整のスピードを上げることで設定数の改善が期待できます。`
    );
  }

  const docScreen = leadTimes.find((l) => l.fromStage === '応募' && l.toStage === '書類選考');
  if (docScreen && docScreen.sampleSize > 0 && docScreen.avgDays !== null && docScreen.avgDays > 3) {
    advice.push(
      `応募から書類選考完了までに平均${docScreen.avgDays}日かかっています。書類選考の判定スピードを上げることで、後続の面談設定数も増やせる可能性があります。`
    );
  }

  if (channelStats.length > 0) {
    const sorted = [...channelStats].sort((a, b) => b.applicants - a.applicants);
    const top = sorted[0];
    const totalApplicants = channelStats.reduce((s, c) => s + c.applicants, 0);
    if (totalApplicants > 0 && top.applicants / totalApplicants > 0.6) {
      advice.push(
        `応募の${Math.round((top.applicants / totalApplicants) * 100)}%が「${top.channel}」に集中しています。母集団が不足気味な場合は、他チャネルへの出稿も検討してください。`
      );
    } else if (totalApplicants === 0) {
      advice.push('この期間の応募者がいません。母集団形成(媒体出稿・エージェント連携・リファラル強化)から見直してください。');
    }
  }

  if (advice.length === 0) {
    advice.push('応募者数自体が少ない可能性があります。母集団形成の強化(媒体追加・エージェント活用・リファラル施策)を検討してください。');
  }

  return advice;
}
