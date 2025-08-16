// Convert the existing airlinesMap.json to Maps for efficient lookups
const airlinesData = [
  ["0B","BMS"],["2L","OAW"],["2P","GAP"],["3O","MAC"],["3U","CSC"],["3V","TAY"],
  ["4O","MNE"],["4Y","OCN"],["4Z","LNK"],["5J","CEB"],["5X","UPS"],["5Y","GTI"],
  ["6E","IGO"],["6H","ISR"],["6Y","ART"],["7C","JJA"],["7J","TJK"],["7W","WRC"],
  ["8C","ATN"],["8L","LKE"],["8U","AAW"],["9C","CQH"],["9E","EDV"],["9U","MLD"],
  ["A3","AEE"],["A4","AZO"],["A5","HOP"],["AA","AAL"],["AD","AZU"],["AE","MDA"],
  ["AF","AFR"],["AH","DAH"],["AI","AIC"],["AK","AXM"],["AL","MLT"],["AM","AMX"],
  ["APJ","APJ"],["AQ","JYH"],["AR","ARG"],["AS","ASA"],["AT","RAM"],["AV","AVA"],
  ["AY","FIN"],["AZ","ITY"],["B2","BRU"],["B6","JBU"],["B7","UIA"],["BA","BAW"],
  ["BC","SKY"],["BF","FBU"],["BI","RBA"],["BL","PIC"],["BP","BOT"],["BR","EVA"],
  ["BS","UBG"],["BT","BTI"],["BW","BWA"],["BY","TOM"],["C8","ICV"],["CA","CCA"],
  ["CD","CND"],["CI","CAL"],["CJ","CFE"],["CM","CMP"],["CV","CLX"],["CX","CPA"],
  ["CY","CYP"],["CZ","CSN"],["D7","XAX"],["DD","NOK"],["DE","CFG"],["DG","SRQ"],
  ["DL","DAL"],["DR","RLH"],["DV","VSV"],["DY","NOZ"],["E4","ENT"],["EI","EIN"],
  ["EK","UAE"],["EL","ELB"],["EN","DLA"],["ET","ETH"],["EU","UEA"],["EW","EWG"],
  ["EY","ETD"],["FA","SFR"],["FB","LZB"],["FD","AIQ"],["FI","ICE"],["FJ","FJI"],
  ["F8","FLE"],["FL","SWG"],["FM","CXA"],["F9","FFT"],["FR","RYR"],["FX","FDX"],
  ["FY","FFM"],["G3","GLO"],["G4","AAY"],["GA","GIA"],["GF","GFA"],["GJ","CDC"],
  ["GM","GSW"],["G8","GOW"],["GQ","SEH"],["GS","GCR"],["GX","CBJ"],["H2","SKU"],
  ["HA","HAL"],["HD","ADO"],["HF","KAC"],["HG","HAL"],["HK","CRK"],["HM","SEY"],
  ["HO","DKH"],["HR","HKE"],["HU","CHH"],["HX","CRK"],["HY","UZB"],["I2","IBS"],
  ["IB","IBE"],["IE","SOL"],["IF","FBA"],["IG","BTK"],["II","IAD"],["IT","TTW"],
  ["IZ","AIZ"],["J2","AHY"],["J9","JZR"],["JJ","TAM"],["JL","JAL"],["JM","JMA"],
  ["LJ","JNA"],["JO","JTG"],["JP","ADR"],["JT","LNI"],["JU","ASL"],["JW","JJP"],
  ["JX","SJX"],["K4","CKS"],["K6","KHV"],["KA","HDA"],["KC","KZR"],["KE","KAL"],
  ["KF","FIN"],["KL","KLM"],["KM","AMC"],["KQ","KQA"],["KU","KAC"],["KY","CUA"],
  ["L3","LRC"],["LA","LAN"],["LH","DLH"],["LI","LIA"],["LN","LAA"],["LO","LOT"],
  ["LR","LRC"],["LS","EXS"],["LX","SWR"],["LY","ELY"],["M7","MAA"],["MB","MNB"],
  ["ME","MEA"],["MF","CXA"],["MH","MAS"],["MK","MAU"],["MM","APJ"],["MN","MNO"],
  ["MS","MSR"],["MU","CES"],["MV","VKG"],["MX","MXY"],["WY","OMA"],["N4","NWS"],
  ["NF","AVN"],["NG","NGA"],["NH","ANA"],["NK","NKS"],["NL","KLM"],["NO","NOS"],
  ["NP","NMB"],["NT","IBB"],["NW","NWA"],["NZ","ANZ"],["OA","OAL"],["OD","MXD"],
  ["OE","LMO"],["OG","FPY"],["OH","JIA"],["OK","CSA"],["OM","MGL"],["OO","SKW"],
  ["OR","TFL"],["OS","AUA"],["OZ","AAR"],["P2","XPF"],["P4","APK"],["PC","PGT"],
  ["PD","POE"],["PG","BKP"],["PK","PIA"],["PO","PAC"],["PQ","SQP"],["PR","PAL"],
  ["PS","AUI"],["PT","PDT"],["PX","ANG"],["QF","QFA"],["QH","BAV"],["QK","JZA"],
  ["QR","QTR"],["QS","TVS"],["QY","BCS"],["RA","RNA"],["RB","SYR"],["RJ","RJA"],
  ["RK","RUK"],["RO","ROT"],["RU","ABW"],["RV","ROU"],["RW","RWD"],["RZ","RZO"],
  ["S2","JAI"],["S4","RZO"],["S7","SBI"],["SB","ACI"],["SC","CDG"],["FV","SDM"],
  ["SE","SEY"],["SG","SEJ"],["SJ","SJY"],["SK","SAS"],["SL","TLM"],["SN","BEL"],
  ["SP","SAT"],["SQ","SIA"],["SS","CRL"],["SU","AFL"],["SV","SVA"],["SY","SCX"],
  ["T3","EZE"],["T5","TUA"],["TA","TAI"],["TB","JAF"],["TK","THY"],["TL","TLM"],
  ["TN","THT"],["TO","TVF"],["TP","TAP"],["TR","TGW"],["TU","TAR"],["TV","TBA"],
  ["TW","TWB"],["U2","EZY"],["U6","SVR"],["U8","CYF"],["UA","UAL"],["UK","VTI"],
  ["UM","AZW"],["UT","UTA"],["UU","REU"],["UX","AEA"],["V7","VOE"],["VA","VOZ"],
  ["VB","VIV"],["VJ","VJC"],["VK","VKG"],["VN","HVN"],["VS","VIR"],["VT","VTA"],
  ["VY","VLG"],["W5","IRM"],["W6","WZZ"],["W7","WRC"],["WB","RWD"],["WF","WIF"],
  ["WN","SWA"],["WO","WSW"],["WP","WPA"],["WS","WJA"],["WT","SWT"],["X3","TUI"],
  ["XC","CAI"],["XE","JSX"],["XK","CCM"],["XL","LXP"],["XP","VXP"],["XQ","SXS"],
  ["XR","CXI"],["XY","KNE"],["Y4","VOI"],["Y7","TYA"],["Y8","YZR"],["YV","ASH"],
  ["YW","ANE"],["ZL","RXA"],["ZT","AWC"],["ZU","AZU"],["ZF","AZV"],["ZN","MBN"],
  ["VX","VRD"],["G9","ABY"],["FZ","FDB"],["UO","HKE"],["IBK","IBK"],["AC","ACA"],
  ["TG","THA"],["UL","ALK"],["HV","TRA"],["JQ","JST"],["WR","WEN"],["MQ","ENY"],
  ["YX","RPA"],["QX","QXE"],["C5","UCA"],["ZW","AWI"],["DP","PBD"],["IX","AXB"],
  ["QP","AKJ"],["VZ","TVJ"],["QZ","AWQ"],["QG","CTV"],["ID","BTK"],["Z2","APG"],
  ["XG","SXD"],["F3","FAD"],["OV","OMS"]
];

// Create Maps for efficient lookups
export const ICAO_FROM_IATA = new Map<string, string>();
export const IATA_FROM_ICAO = new Map<string, string>();

// Populate the maps
airlinesData.forEach(([iata, icao]) => {
  ICAO_FROM_IATA.set(iata, icao);
  IATA_FROM_ICAO.set(icao, iata);
});
