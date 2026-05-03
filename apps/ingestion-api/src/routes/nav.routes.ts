import { Router, Request, Response } from "express";

export const navRouter: Router = Router();

const navManifest = {
  version: "v2.1",
  routes: [
    {
      path: "/",
      title: { tr: "Ana Sayfa", en: "Home" },
      nav: { group: "brand", weight: 1 },
      hooks: { onEnter: "fade" }
    },
    {
      path: "/tr/masajlar/index.html",
      title: { tr: "Masajlar", en: "Massages" },
      nav: { group: "service", weight: 10, menu: "mega-services" },
      hooks: { onEnter: "liquid-wave" }
    },
    {
      path: "/tr/hamam/index.html",
      title: { tr: "Hamam", en: "Turkish Bath" },
      nav: { group: "service", weight: 20, menu: "mega-services" },
      hooks: { onEnter: "liquid-wave" }
    },
    {
      path: "/tr/cilt-bakimi/index.html",
      title: { tr: "Cilt Bakımı", en: "Skin Care" },
      nav: { group: "service", weight: 30, menu: "mega-services" },
      hooks: { onEnter: "liquid-wave" }
    },
    {
      path: "/tr/hakkimizda/index.html",
      title: { tr: "Hakkımızda", en: "About Us" },
      nav: { group: "brand", weight: 40 },
      hooks: { onEnter: "fade" }
    },
    {
      path: "/iletisim.html",
      title: { tr: "İletişim", en: "Contact" },
      nav: { group: "action", weight: 100 },
      hooks: { onEnter: "fade" }
    }
  ]
};

navRouter.get("/nav-manifest", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.json(navManifest);
});
