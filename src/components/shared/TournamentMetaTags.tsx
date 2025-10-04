import { useEffect, useState } from "react";
import type { Tournament } from "@/types";
import { generateTournamentOgImage } from "@/utils/generateTournamentImage";

interface TournamentMetaTagsProps {
  tournament: Tournament;
}

export const TournamentMetaTags: React.FC<TournamentMetaTagsProps> = ({
  tournament,
}) => {
  const [ogImage, setOgImage] = useState<string | null>(null);

  useEffect(() => {
    generateTournamentOgImage(tournament).then(setOgImage).catch(console.error);
  }, [tournament]);

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

    if (ogImage) {
      let metaOgImage = document.querySelector('meta[property="og:image"]');
      if (!metaOgImage) {
        metaOgImage = document.createElement("meta");
        metaOgImage.setAttribute("property", "og:image");
        document.head.appendChild(metaOgImage);
      }
      metaOgImage.setAttribute("content", ogImage);

      let metaTwitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!metaTwitterImage) {
        metaTwitterImage = document.createElement("meta");
        metaTwitterImage.setAttribute("name", "twitter:image");
        document.head.appendChild(metaTwitterImage);
      }
      metaTwitterImage.setAttribute("content", ogImage);

      let metaTwitterCard = document.querySelector('meta[name="twitter:card"]');
      if (!metaTwitterCard) {
        metaTwitterCard = document.createElement("meta");
        metaTwitterCard.setAttribute("name", "twitter:card");
        document.head.appendChild(metaTwitterCard);
      }
      metaTwitterCard.setAttribute("content", "summary_large_image");
    }

    return () => {
      document.title = "Поехали!";
      if (metaDescription) {
        metaDescription.setAttribute("content", "Poehali.dev — запусти свой сайт за минуту!");
      }
    };
  }, [tournament, ogImage]);

  return null;
};