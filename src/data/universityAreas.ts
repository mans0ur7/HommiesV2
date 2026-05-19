// University and college areas in Danish cities
import copenhagenImg from "@/assets/cities/copenhagen.jpg";
import aarhusImg from "@/assets/cities/aarhus.jpg";
import odenseImg from "@/assets/cities/odense.jpg";
import aalborgImg from "@/assets/cities/aalborg.jpg";
import roskildeImg from "@/assets/cities/roskilde.jpg";
import amagerImg from "@/assets/cities/amager.jpg";
import frederiksbergImg from "@/assets/cities/frederiksberg.jpg";
import esbjergImg from "@/assets/cities/esbjerg.jpg";
import koldingImg from "@/assets/cities/kolding.jpg";
import horsensImg from "@/assets/cities/horsens.jpg";
import norrebroImg from "@/assets/cities/norrebro.jpg";
import orestadImg from "@/assets/cities/orestad.jpg";
import indrebyImg from "@/assets/cities/indreby.jpg";
import lyngbyImg from "@/assets/cities/lyngby.jpg";
import universitetsparkenImg from "@/assets/cities/universitetsparken.jpg";
import katrinebjergImg from "@/assets/cities/katrinebjerg.jpg";
import skejbyImg from "@/assets/cities/skejby.jpg";
import midtbyenImg from "@/assets/cities/midtbyen.jpg";
import risskovImg from "@/assets/cities/risskov.jpg";
import sduCampusImg from "@/assets/cities/sdu-campus.jpg";
import cortexParkImg from "@/assets/cities/cortex-park.jpg";
import cityCampusImg from "@/assets/cities/city-campus.jpg";
import bolbroImg from "@/assets/cities/bolbro.jpg";
import aauCampusImg from "@/assets/cities/aau-campus.jpg";
import aalborgMidtbyenImg from "@/assets/cities/aalborg-midtbyen.jpg";
import vestbyenImg from "@/assets/cities/vestbyen.jpg";
import ogadekvarteretImg from "@/assets/cities/ogadekvarteret.jpg";
import trekronerImg from "@/assets/cities/trekroner.jpg";
import roskildeCImg from "@/assets/cities/roskilde-c.jpg";
import musiconImg from "@/assets/cities/musicon.jpg";
import sanktJorgensbjergImg from "@/assets/cities/sankt-jorgensbjerg.jpg";

export interface UniversityArea {
  name: string;
  university: string;
  image: string;
}

export const universityAreas: Record<string, UniversityArea[]> = {
  "København": [
    { name: "Frederiksberg", university: "CBS - Copenhagen Business School", image: frederiksbergImg },
    { name: "Nørrebro", university: "Københavns Universitet (KU)", image: norrebroImg },
    { name: "Ørestad", university: "IT-Universitetet (ITU)", image: orestadImg },
    { name: "Amager", university: "Københavns Universitet (Amager)", image: amagerImg },
    { name: "Indre By", university: "Københavns Universitet (City)", image: indrebyImg },
    { name: "Lyngby", university: "DTU - Danmarks Tekniske Universitet", image: lyngbyImg },
  ],
  "Aarhus": [
    { name: "Universitetsparken", university: "Aarhus Universitet", image: universitetsparkenImg },
    { name: "Katrinebjerg", university: "AU - IT & Datalogi", image: katrinebjergImg },
    { name: "Skejby", university: "AU - Sundhedsvidenskab", image: skejbyImg },
    { name: "Midtbyen", university: "VIA University College", image: midtbyenImg },
    { name: "Risskov", university: "AARHUS TECH", image: risskovImg },
  ],
  "Odense": [
    { name: "SDU Campus", university: "Syddansk Universitet", image: sduCampusImg },
    { name: "Cortex Park", university: "SDU TEK", image: cortexParkImg },
    { name: "City Campus", university: "UCL Erhvervsakademi", image: cityCampusImg },
    { name: "Bolbro", university: "NEXT Uddannelse", image: bolbroImg },
  ],
  "Aalborg": [
    { name: "AAU Campus", university: "Aalborg Universitet", image: aauCampusImg },
    { name: "Midtbyen", university: "UCN - Professionshøjskolen", image: aalborgMidtbyenImg },
    { name: "Vestbyen", university: "TECH College Aalborg", image: vestbyenImg },
    { name: "Øgadekvarteret", university: "AAU Create", image: ogadekvarteretImg },
  ],
  "Roskilde": [
    { name: "Trekroner", university: "Roskilde Universitet (RUC)", image: trekronerImg },
    { name: "Roskilde C", university: "ZIBAT - Zealand", image: roskildeCImg },
    { name: "Musicon", university: "RUC Campus", image: musiconImg },
    { name: "Sankt Jørgensbjerg", university: "EASJ", image: sanktJorgensbjergImg },
  ],
  "Esbjerg": [
    { name: "SDU Esbjerg", university: "Syddansk Universitet", image: esbjergImg },
    { name: "Midtbyen", university: "UC Syd", image: esbjergImg },
    { name: "Gjesing", university: "EUC Vest", image: esbjergImg },
    { name: "Hjerting", university: "AMU Vest", image: esbjergImg },
  ],
  "Kolding": [
    { name: "SDU Kolding", university: "Syddansk Universitet", image: koldingImg },
    { name: "Designskolen", university: "Design School Kolding", image: koldingImg },
    { name: "IBA Campus", university: "IBA Erhvervsakademi", image: koldingImg },
    { name: "Seest", university: "UC Syd", image: koldingImg },
  ],
  "Horsens": [
    { name: "VIA Campus", university: "VIA University College", image: horsensImg },
    { name: "Midtbyen", university: "Learnmark Horsens", image: horsensImg },
    { name: "Torsted", university: "SOSU Horsens", image: horsensImg },
    { name: "Sønderbro", university: "VIA Business", image: horsensImg },
  ],
  "Frederiksberg": [
    { name: "CBS Campus", university: "Copenhagen Business School", image: frederiksbergImg },
    { name: "Frederiksberg C", university: "Frederiksberg Gymnasium", image: frederiksbergImg },
    { name: "Solbjerg", university: "CBS Solbjerg", image: frederiksbergImg },
    { name: "Falkoner Plads", university: "KEA", image: frederiksbergImg },
  ],
  "Amager": [
    { name: "Ørestad", university: "IT-Universitetet (ITU)", image: orestadImg },
    { name: "Islands Brygge", university: "KU Amager Campus", image: amagerImg },
    { name: "Amager Strand", university: "Københavns Universitet", image: amagerImg },
    { name: "Tårnby", university: "CPH Business", image: amagerImg },
  ],
};

// Default areas for when no city is selected (top Danish university cities)
export const defaultUniversityAreas: UniversityArea[] = [
  { name: "København", university: "KU, CBS, ITU, DTU", image: copenhagenImg },
  { name: "Aarhus", university: "Aarhus Universitet", image: aarhusImg },
  { name: "Odense", university: "Syddansk Universitet", image: odenseImg },
  { name: "Aalborg", university: "Aalborg Universitet", image: aalborgImg },
  { name: "Roskilde", university: "Roskilde Universitet", image: roskildeImg },
];
