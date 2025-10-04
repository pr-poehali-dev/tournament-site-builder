import { useEffect } from "react";
import type { Tournament } from "@/types";

interface TournamentMetaTagsProps {
  tournament: Tournament;
}

export const TournamentMetaTags: React.FC<TournamentMetaTagsProps> = ({
  tournament,
}) => {
  useEffect(() => {
    const title = `${tournament.name} - Турнир`;
    const description = `${tournament.date} • ${tournament.city} • ${tournament.participants.length} участников • ${
      tournament.swissRounds > 0 && tournament.topRounds > 0
        ? `Швейцарка ${tournament.swissRounds} + Топ ${tournament.topRounds}`
        : tournament.swissRounds > 0
          ? `Швейцарка ${tournament.swissRounds} туров`
          : `Плей-офф ${tournament.topRounds} туров`
    }`;

    document.title = title;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    let metaOgTitle = document.querySelector('meta[property="og:title"]');
    if (!metaOgTitle) {
      metaOgTitle = document.createElement("meta");
      metaOgTitle.setAttribute("property", "og:title");
      document.head.appendChild(metaOgTitle);
    }
    metaOgTitle.setAttribute("content", title);

    let metaOgDescription = document.querySelector('meta[property="og:description"]');
    if (!metaOgDescription) {
      metaOgDescription = document.createElement("meta");
      metaOgDescription.setAttribute("property", "og:description");
      document.head.appendChild(metaOgDescription);
    }
    metaOgDescription.setAttribute("content", description);

    let metaTwitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!metaTwitterTitle) {
      metaTwitterTitle = document.createElement("meta");
      metaTwitterTitle.setAttribute("name", "twitter:title");
      document.head.appendChild(metaTwitterTitle);
    }
    metaTwitterTitle.setAttribute("content", title);

    let metaTwitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!metaTwitterDescription) {
      metaTwitterDescription = document.createElement("meta");
      metaTwitterDescription.setAttribute("name", "twitter:description");
      document.head.appendChild(metaTwitterDescription);
    }
    metaTwitterDescription.setAttribute("content", description);

    return () => {
      document.title = "Поехали!";
      if (metaDescription) {
        metaDescription.setAttribute("content", "Poehali.dev — запусти свой сайт за минуту!");
      }
    };
  }, [tournament]);

  return null;
};
