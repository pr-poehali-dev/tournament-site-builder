import type { Tournament } from "@/types";

export const generateTournamentOgImage = async (tournament: Tournament): Promise<string> => {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1e293b");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.fillRect(0, 0, canvas.width, 200);

  ctx.font = "bold 64px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  const maxWidth = 1100;
  const tournamentName = tournament.name.length > 30 
    ? tournament.name.substring(0, 30) + "..." 
    : tournament.name;
  ctx.fillText(tournamentName, canvas.width / 2, 150, maxWidth);

  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#94a3b8";
  
  const formatText = tournament.swissRounds > 0 && tournament.topRounds > 0
    ? `Швейцарка ${tournament.swissRounds} + Топ ${tournament.topRounds}`
    : tournament.swissRounds > 0
      ? `Швейцарка ${tournament.swissRounds} туров`
      : `Плей-офф ${tournament.topRounds} туров`;
  
  ctx.fillText(formatText, canvas.width / 2, 250);

  const infoY = 350;
  const infoSpacing = 80;
  
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("📅", 200, infoY);
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "left";
  ctx.fillText(tournament.date, 260, infoY);

  ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.fillText("📍", canvas.width / 2, infoY);
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "left";
  ctx.fillText(tournament.city, canvas.width / 2 + 60, infoY);

  ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.fillText("👥", 200, infoY + infoSpacing);
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "left";
  ctx.fillText(`${tournament.participants.length} участников`, 260, infoY + infoSpacing);

  if (tournament.isRated) {
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText("⭐", canvas.width / 2, infoY + infoSpacing);
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    ctx.fillText("Рейтинговый", canvas.width / 2 + 60, infoY + infoSpacing);
  }

  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#475569";
  ctx.textAlign = "center";
  ctx.fillText("🏆 Турнир", canvas.width / 2, 580);

  return canvas.toDataURL("image/png");
};
