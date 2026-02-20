@echo off
if not exist "assets\img\cards" mkdir "assets\img\cards"

:: Use existing campaign images as placeholders for missing product cards
copy /Y "C:\Users\tourg\.gemini\antigravity\brain\42841a8a-115d-462b-8984-190e9037bc6d\santis_campaign_hero_shot_coffee_scrub_1769973838046.png" "assets\img\cards\santis_card_products_v1.png"
copy /Y "C:\Users\tourg\.gemini\antigravity\brain\42841a8a-115d-462b-8984-190e9037bc6d\santis_campaign_the_glow_glass_skin_1769974884465.png" "assets\img\cards\product-oil.png"
copy /Y "C:\Users\tourg\.gemini\antigravity\brain\42841a8a-115d-462b-8984-190e9037bc6d\santis_campaign_the_touch_hara_force_1769974869193.png" "assets\img\cards\hammam.png"
copy /Y "C:\Users\tourg\.gemini\antigravity\brain\42841a8a-115d-462b-8984-190e9037bc6d\santis_campaign_the_touch_hara_force_1769974869193.png" "assets\img\cards\santis_card_hammam_v1.png"
copy /Y "C:\Users\tourg\.gemini\antigravity\brain\42841a8a-115d-462b-8984-190e9037bc6d\santis_campaign_the_glow_glass_skin_1769974884465.png" "assets\img\cards\product-cream.png"
copy /Y "C:\Users\tourg\.gemini\antigravity\brain\42841a8a-115d-462b-8984-190e9037bc6d\santis_campaign_hero_shot_coffee_scrub_1769973838046.png" "assets\img\cards\product-soap.png"

echo Card Assets Populated!
pause
