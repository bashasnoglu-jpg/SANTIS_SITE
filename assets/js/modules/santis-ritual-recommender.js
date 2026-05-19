export const RITUAL_RECOMMENDATIONS = {
  recover: {
    title: "Deep Tissue Recovery",
    category: "Massage",
    duration: "75 min",
    promise: "Kas yorgunluğunu azaltır, bedeni yeniden dengeler.",
    href: "/tr/masajlar/deep-tissue-masaji.html"
  },
  calm: {
    title: "Aromatherapy Calm Ritual",
    category: "Massage",
    duration: "60 min",
    promise: "Zihinsel gerginliği yumuşatır, nefesi sakinleştirir.",
    href: "/tr/masajlar/aromaterapi-masaji.html"
  },
  glow: {
    title: "Glow Facial Ritual",
    category: "Skin",
    duration: "60 min",
    promise: "Cildi canlandırır, yumuşak ve aydınlık bir görünüm kazandırır.",
    href: "/tr/cilt-bakimi/"
  },
  "deep-reset": {
    title: "Santis Signature Reset",
    category: "Signature",
    duration: "90 min",
    promise: "Beden, zihin ve atmosferi tek bir derin yenilenme akışında birleştirir.",
    href: "/tr/paketler/"
  },
  "couple-ritual": {
    title: "Couple Serenity Ritual",
    category: "Couple",
    duration: "90 min",
    promise: "İki kişi için sakin, mahrem ve dengeli bir spa deneyimi sunar.",
    href: "/tr/paketler/"
  }
};

export function getRitualRecommendation(intent) {
  return RITUAL_RECOMMENDATIONS[intent] || RITUAL_RECOMMENDATIONS.calm;
}
