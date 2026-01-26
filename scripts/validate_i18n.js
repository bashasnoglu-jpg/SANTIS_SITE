< !doctype html >

    <html lang="tr">

        <head>

            <meta charset="utf-8" />

            <meta name="viewport" content="width=device-width,initial-scale=1" />

            <title>Site Navigasyonu</title>

            <style>

    /* Genel font ve yapı */

                nav {

                    font - family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;

    }



                /* Liste sıfırlama */

                .nav-list,

                .nav-sub {

                    list - style: none;

                margin: 0;

                padding: 0;

    }



                /* Menü öğeleri */

                .nav-item {

                    margin: 6px 0;

    }



                /* Bağlantılar */

                .nav-link {

                    text - decoration: none;

                color: #111;

                transition: color 0.2s ease;

    }



                .nav-link:hover {

                    text - decoration: underline;

                color: #0070f3;

    }



    /* Üst seviye pointer */

    .nav-list > .nav-item::before {

                    content: "• ";

    }



                /* Alt menü */

                .nav-sub {

                    margin - top: 6px;

                padding-left: 18px;

    }



                .nav-sub .nav-item::before {

                    content: "› ";

    }



                /* CTA (Call to Action) */

                .nav-item--cta {

                    margin - top: 10px;

    }



                .nav-item--cta::before {

                    content: "★ ";

    }



                .nav-link--cta {

                    font - weight: 700;

                color: #c0392b;

    }



                .nav-link--cta:hover {1

                    color: #e74c3c;

                text-decoration: underline;

    }

            </style>

        </head>



        <body>

            <nav aria-label="Ana Navigasyon">

                <ul class="nav-list">

                    <li class="nav-item"><a class="nav-link" href="/">Ana Sayfa</a></li>

                    <li class="nav-item"><a class="nav-link" href="/hamam-rituelleri">Hamam Ritüelleri</a></li>



                    <li class="nav-item">

                        <a class="nav-link" href="/masajlar">Masajlar</a>

                        <ul class="nav-sub">

                            <li class="nav-item"><a class="nav-link" href="/masajlar/klasik-masajlar">Klasik Masajlar</a></li>

                            <li class="nav-item"><a class="nav-link" href="/masajlar/spor-terapi-masajlari">Spor &amp; Terapi Masajları</a></li>

                            <li class="nav-item"><a class="nav-link" href="/masajlar/asya-masajlari">Asya Masajları</a></li>

                            <li class="nav-item"><a class="nav-link" href="/masajlar/ayurveda-rituelleri">Ayurveda Ritüelleri</a></li>

                        </ul>

                    </li>



                    <li class="nav-item"><a class="nav-link" href="/signature-couples">Signature &amp; Couples</a></li>

                    <li class="nav-item"><a class="nav-link" href="/kids-family">Kids &amp; Family</a></li>

                    <li class="nav-item"><a class="nav-link" href="/face-sothys">Face – Sothys</a></li>

                    <li class="nav-item"><a class="nav-link" href="/urunler">Ürünler</a></li>

                    <li class="nav-item"><a class="nav-link" href="/hakkimizda">Hakkımızda</a></li>

                    <li class="nav-item"><a class="nav-link" href="/ekibimiz">Ekibimiz</a></li>



                    <li class="nav-item nav-item--cta">

                        <a class="nav-link nav-link--cta" href="/rezervasyon">Rezervasyon / WhatsApp</a>

                    </li>

                </ul>

            </nav>

        </body>

    </html>


