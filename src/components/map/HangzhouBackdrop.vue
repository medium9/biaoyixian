<script setup lang="ts">
/**
 * 连续的地形底色 + 等高线。所有高度层次仅用于示意绘图，不代表实测海拔。
 * 渐变范围足够宽，避免山地边界在缩放后变成拼接色块。
 */
const ridges = [
  { x: 240, y: 410, rx: 180, ry: 240, angle: 32, phase: 0.4 },
  { x: 100, y: 710, rx: 225, ry: 240, angle: -22, phase: 1.2 },
  { x: 230, y: 1010, rx: 220, ry: 255, angle: 24, phase: 2.3 },
  { x: 420, y: 1150, rx: 230, ry: 160, angle: -28, phase: 0.8 },
  { x: 650, y: 940, rx: 245, ry: 130, angle: 8, phase: 1.8 },
  { x: 900, y: 840, rx: 125, ry: 180, angle: 26, phase: 2.5 },
];
const contours = ridges.flatMap((ridge, ridgeIndex) =>
  Array.from({ length: 5 }, (_, level) => {
    const scale = 0.22 + level * 0.18;
    const points = Array.from({ length: 90 }, (_, i) => {
      const a = (i / 90) * Math.PI * 2;
      const warp = 1 + 0.10 * Math.sin(a * 3 + ridge.phase) + 0.045 * Math.cos(a * 5 - ridge.phase);
      const x = Math.cos(a) * ridge.rx * scale * warp;
      const y = Math.sin(a) * ridge.ry * scale * warp;
      const rotation = (ridge.angle * Math.PI) / 180;
      return [ridge.x + x * Math.cos(rotation) - y * Math.sin(rotation),
              ridge.y + x * Math.sin(rotation) + y * Math.cos(rotation)];
    });
    return { id: ridgeIndex + '-' + level, path: 'M' + points.map(p => p.map(n => n.toFixed(1)).join(',')).join('L') + 'Z', opacity: 0.14 - level * 0.015 };
  }),
);
const roads = [
 'M-1600 145 Q-1100 110-700 160 C-220 190 130 35 470 70 S1110 30 1760-70 S2380-160 2790-55',
 'M-450 310 C-100 270 165 175 470 160 S1020 100 1530 240 S2190 237 2790 128',
 'M410-380 C460-90 510 110 630 260 S920 330 1000 430',
 'M760-350 C740-30 810 130 940 330 S1040 650 1100 850 S1320 1110 1600 1300',
 'M1080-330 C1085 0 1150 225 1165 520 S1230 880 1450 1050',
 'M1450-300 C1370 40 1420 360 1390 600 S1550 950 1780 1100',
 'M-200 25 C200-80 400-160 730-140 S1260-45 1660-100',
 'M520 240 C700 190 900 210 1180 300 S1540 340 1750 430 C1930 503 2110 453 2260 379 S2560 300 2790 257',
 'M940 450 C1130 400 1380 470 1730 530 C1930 564 2090 510 2260 445 S2510 382 2790 320',
 'M970 700 C1210 650 1380 740 1720 805',
 'M1040 915 C1190 850 1350 900 1590 965',
 'M340 1350 C530 1190 730 1140 950 1020 S1280 825 1500 720',
 'M470 1540 C700 1420 940 1460 1170 1350 S1500 1230 1850 1280 C2100 1310 2310 1120 2480 1060 S2680 1020 2790 960',
 'M1950-640 C1930-330 1960-30 2020 172 S2110 365 2058 510',
 'M2410-630 C2370-388 2390-154 2420 5 S2440 236 2490 390',
 'M1800 1620 C1890 1370 1975 1100 2180 970 S2510 820 2790 768',
];
const paths = [
 'M450 180 C390 245 360 310 310 380 S190 465 160 530',
 'M170 515 C270 525 345 540 405 615 S480 730 470 830',
 'M100 715 C190 750 340 740 430 810 S490 945 580 980',
 'M210 1040 C330 1030 435 1000 510 930 S690 845 780 865',
 'M215 1215 C320 1175 390 1110 460 1050 S560 1020 610 975',
 'M550 625 C450 590 350 630 310 700',
];
const sideStreets = [
 'M510 14 Q755 -2 952 42 T1417 123 T1880 241',
 'M594 119 Q765 101 964 143 T1320 227 T1800 343',
 'M1225 -100 Q1198 69 1250 245 T1334 555 T1450 762',
 'M1546 10 Q1516 205 1560 383 T1640 599',
 'M1030 369 Q1250 349 1470 482 T1895 545',
 'M1060 545 Q1252 515 1448 626 L1628 652',
 'M660 1438 Q925 1530 1150 1457 T1590 1267 T2020 1033 Q2260 864 2770 850',
 'M1760 110 Q1990 39 2190 47 T2710 27',
 'M1690 265 Q1960 290 2180 218 T2690 159',
 'M2190-500 Q2110-160 2200 84 T2260 379',
 'M2210 1440 Q2240 1200 2340 1055 T2540 773',
 'M1085 1324 Q1130 1415 1257 1546 M1450 1198 Q1520 1280 1690 1358',
];
const groves = [
 {x:145,y:330,scale:1.3},{x:290,y:460,scale:.9},{x:411,y:530,scale:1.5},
 {x:215,y:680,scale:1.7},{x:368,y:767,scale:1.2},{x:92,y:960,scale:1.4},
 {x:422,y:1010,scale:1.3},{x:330,y:1162,scale:1.6},{x:620,y:1035,scale:1.4},
 {x:803,y:980,scale:1.3},{x:936,y:787,scale:1},{x:1245,y:644,scale:1.2},
 {x:1510,y:1154,scale:1.3},{x:1220,y:1440,scale:1.75},
];
</script>

<template>
  <g class="backdrop" pointer-events="none">
    <defs>
      <linearGradient id="land-tone" gradientUnits="userSpaceOnUse" x1="-1700" y1="-1300" x2="2700" y2="-700">
        <stop offset="0" stop-color="#dbe5d4"/>
        <stop offset=".55" stop-color="#e5ebdc"/>
        <stop offset="1" stop-color="#eff0e7"/>
      </linearGradient>
      <radialGradient id="ridge-wash">
        <stop offset="0" stop-color="#91b18b" stop-opacity=".46"/>
        <stop offset=".45" stop-color="#a5be9a" stop-opacity=".30"/>
        <stop offset=".78" stop-color="#bdd0af" stop-opacity=".12"/>
        <stop offset="1" stop-color="#dce6d2" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="lake-water" x1="0" y1="0" x2=".7" y2="1">
        <stop stop-color="#b7d9d8"/><stop offset="1" stop-color="#9fc9ca"/>
      </linearGradient>
      <linearGradient id="river-water" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#a9d0d1"/><stop offset="1" stop-color="#badbd9"/>
      </linearGradient>
      <path id="west-lake" d="M714 349 C743 329 774 336 803 340 C833 343 855 353 874 371 C889 386 899 414 901 441 C903 471 916 482 914 516 C913 548 902 564 902 596 C901 626 879 642 863 666 C841 701 804 723 768 740 C741 752 716 763 688 752 C663 742 649 723 629 710 C607 696 596 676 588 654 C577 625 567 608 578 580 C588 553 605 539 622 517 C640 494 650 475 661 449 C673 420 684 371 714 349Z"/>
      <path id="qian-river" d="M-2400 2580 C-1890 2480-1550 2320-1000 2130 C-360 1910 90 1590 360 1375 C480 1275 570 1218 720 1205 C960 1182 1190 1050 1420 850 C1660 643 1920 550 2400 450 C2660 396 2840 282 3070 190 S3820-80 4320-245 L4410 20 C3910 169 3450 266 3150 407 S2780 654 2500 700 C2010 780 1780 885 1550 1065 C1290 1265 1045 1355 775 1370 C610 1378 555 1430 445 1530 C160 1788-290 2075-920 2350 C-1400 2560-1840 2730-2330 2850Z"/>
      <g id="park-grove" fill="none" stroke="#688967" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-22 5l6-11 6 11m-6 0v6 M-5-5l8-14 8 14m-8 0v7 M10 13l7-12 7 12m-7 0v6"/>
      </g>
      <g id="water-ripple" fill="none" stroke="#eef7eb" stroke-width="1.7" stroke-linecap="round">
        <path d="M-22-3q10-4 20 0t21 0m-9 8q9-4 17-1"/>
      </g>
    </defs>

    <!-- 同一底色铺满画布，山体以相互融合的地形晕染连接。 -->
    <rect x="-12000" y="-12000" width="24000" height="24000" fill="url(#land-tone)"/>
    <g>
      <ellipse cx="1510" cy="1330" rx="780" ry="330" fill="url(#ridge-wash)"/>
      <ellipse cx="2460" cy="1030" rx="690" ry="370" fill="url(#ridge-wash)" opacity=".52"/>
      <ellipse v-for="(ridge, i) in ridges" :key="i" :cx="ridge.x" :cy="ridge.y" :rx="ridge.rx * 2.5" :ry="ridge.ry * 2.3" fill="url(#ridge-wash)" :transform="'rotate('+ridge.angle+' '+ridge.x+' '+ridge.y+')'"/>
    </g>

    <!-- 茶坡，以有机轮廓和浅层纹理连接相邻山地。 -->
    <path d="M269 779C332 743 401 766 443 809S451 893 415 919 315 940 253 899 222 813 269 779Z" fill="#b5cda5" opacity=".45"/>
    <g fill="none" stroke="#7b9a70" stroke-width="1.8" opacity=".37">
      <path d="M258 820Q332 778 409 817 M249 834Q330 791 425 833 M252 850Q327 809 428 850 M265 864Q335 829 427 868 M280 877Q346 846 418 886 M296 888Q347 867 396 897"/>
    </g>

    <!-- 道路沿城市边缘分布，不以重复方格覆盖整张山地。 -->
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path v-for="road in roads" :key="'edge'+road" :d="road" stroke="#cdd5c8" stroke-width="9" opacity=".7"/>
      <path v-for="road in roads" :key="road" :d="road" stroke="#f8f8ef" stroke-width="6"/>
      <path v-for="path in paths" :key="path" :d="path" stroke="#f3f3df" stroke-width="4" opacity=".8"/>
      <path v-for="street in sideStreets" :key="street" :d="street" stroke="#faf9ee" stroke-width="3" opacity=".85"/>
    </g>

    <!-- 低对比连续等高线，替代明显重复的三角形纹理。 -->
    <g fill="none" stroke="#6d8b67" stroke-width="1.2">
      <path v-for="contour in contours" :key="contour.id" :d="contour.path" :opacity="contour.opacity"/>
    </g>
    <g opacity=".46">
      <use v-for="grove in groves" :key="grove.x+':'+grove.y" href="#park-grove" :transform="'translate('+grove.x+' '+grove.y+') scale('+grove.scale+')'"/>
    </g>

    <!-- 水岸和水面使用统一色相；水面覆盖岸边道路，不产生道路穿水。 -->
    <use href="#west-lake" fill="none" stroke="#d4e2ce" stroke-width="22"/>
    <use href="#west-lake" fill="url(#lake-water)" stroke="#92bcbb" stroke-width="2"/>
    <use href="#qian-river" fill="none" stroke="#d1e0cf" stroke-width="18"/>
    <use href="#qian-river" fill="url(#river-water)" stroke="#99bfbd" stroke-width="2"/>

    <!-- 苏堤、白堤和湖心小岛，给地图增加可辨识的地理细节。 -->
    <g fill="none" stroke-linecap="round">
      <path d="M716 350 C700 423 680 487 664 547 S644 665 675 745" stroke="#90b5ae" stroke-width="8"/>
      <path d="M716 350 C700 423 680 487 664 547 S644 665 675 745" stroke="#e6ead4" stroke-width="5"/>
      <path d="M706 401 C758 386 813 385 875 401" stroke="#e6ead4" stroke-width="5"/>
      <path d="M714 630 C745 645 776 644 803 633 M718 638 C747 652 774 651 799 642" stroke="#d3e5df" stroke-width="1.5" opacity=".8"/>
    </g>
    <path d="M740 591 Q751 579 763 588 Q773 601 757 612 Q740 611 740 591Z M788 543 Q800 533 810 545 Q810 557 797 558Z" fill="#dbe6ce" stroke="#b4c9ad" stroke-width="1.5"/>
    <g opacity=".74">
      <use href="#water-ripple" x="766" y="450"/><use href="#water-ripple" x="862" y="552"/>
      <use href="#water-ripple" x="746" y="688"/><use href="#water-ripple" x="560" y="1335"/>
      <use href="#water-ripple" x="1060" y="1210"/><use href="#water-ripple" x="1270" y="1100"/>
      <use href="#water-ripple" x="1536" y="928"/><use href="#water-ripple" x="1740" y="790"/>
      <use href="#water-ripple" x="2020" y="707"/><use href="#water-ripple" x="2270" y="615"/>
      <use href="#water-ripple" x="2520" y="535"/><use href="#water-ripple" x="2740" y="475"/>
    </g>
    <!-- 雷峰塔和湖上游船采用低饱和插画造型。 -->
    <g transform="translate(818 733)" stroke="#697d62" stroke-width="1.2" stroke-linejoin="round">
      <path d="M-12 6h24v5h-24z M-9 5v-9H9v9 M-6-9v-8H6v8" fill="#dddfb0"/>
      <path d="M-15 5Q-9 2-7-2H7Q9 2 15 5ZM-12-5Q-6-8-5-12H5Q6-8 12-5ZM-9-14Q-3-17 0-23Q3-17 9-14Z" fill="#788b6b"/>
      <path d="M0 5v-5m-17 11h34" fill="none"/>
    </g>
    <g transform="translate(812 586) rotate(-12)">
      <path d="M-15 3h30l-5 5h-19Z" fill="#577d74"/>
      <path d="M-7 3v-5h15v5M-10-2h20l-4-4h-12Z" fill="#eff1cc" stroke="#6a8872" stroke-width="1"/>
    </g>
    <g class="geographic-label">
      <text x="786" y="514" class="water-title">西 湖</text>
      <text x="830" y="1285" class="river-title" transform="rotate(-18 830 1285)">钱 塘 江</text>
      <text x="350" y="740" class="mountain-title">西湖群山</text>
      <text x="1120" y="340" class="city-title">杭 州</text>
      <text x="350" y="847" class="map-detail-name">龙井茶坡</text>
      <text x="836" y="761" class="map-detail-name">雷峰塔</text>
    </g>
  </g>
</template>

