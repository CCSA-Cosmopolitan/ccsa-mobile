import * as Speech from 'expo-speech';
import API_CONFIG from '../config/api';

const ZORA_BASE_URL =
  process.env.EXPO_PUBLIC_ZORA_API_URL ||
  'http://172.28.16.1:3001';

// ─── Multilingual Knowledge Dictionary for Offline Bush Scouting ──────────────
export const LOCAL_AGRONOMIC_ENCYCLOPEDIA = [
  {
    crops: ['Maize', 'Corn', 'Masara', 'Ọ̀gbàdò', 'Ọ́ka'],
    keywords: ['armyworm', 'caterpillar', 'holes', 'frass', 'ramuka', 'tsutsa', 'kokoro'],
    diagnosis: 'Fall Armyworm (Spodoptera frugiperda) Infestation',
    severity: 'high',
    answer: {
      en: 'Your maize crop is suffering from Fall Armyworm attack. Early instars feed on whorl leaves causing window-pane damage, then bore into the central growing point.',
      ha: 'Masararku tana fama da harin tsutsar Fall Armyworm. Tana cin ganyen masara a cikin gindin shuka.',
      yo: 'Àrùn kòkòrò Fall Armyworm ló ń jẹ àgbàdo yín. Wọ́n ń lu ihò sára ewé àti ọkàn àgbàdo.',
      ig: 'Ọka gị nwere ọrịa Fall Armyworm na-eri akwụkwọ ọka n’ime ime.',
      pcm: 'Your maize get Fall Armyworm insect wey dey chop the leaf inside the center whorl.',
    },
    certifiedTreatment: 'Spray Emamectin benzoate 5% WDG (50g/ha) or Chlorantraniliprole 18.5% SC (100ml/ha). Direct spray nozzle downward into the central whorl during early morning (6:30–9:00 AM) or dusk.',
    organicAlternative: 'Mix fine river sand or dry wood ash with crushed neem seed powder (ratio 1:1) and apply half a teaspoon directly into each central leaf whorl.',
    sprayAdvice: 'Avoid spraying during strong savanna afternoon heat to prevent evaporation.',
  },
  {
    crops: ['Cassava', 'Rogo', 'Gbáàdùkẹ́', 'Akpụ'],
    keywords: ['mosaic', 'yellow', 'wrinkle', 'stunted', 'curl', 'rawaya', 'kumburi', 'ọrịa'],
    diagnosis: 'Cassava Mosaic Geminivirus (CMD)',
    severity: 'medium',
    answer: {
      en: 'Symptoms indicate Cassava Mosaic Disease transmitted by whiteflies (Bemisia tabaci). Leaves show chlorotic blotches, distorted margins, and reduced tuber bulking.',
      ha: 'Wannan cutar Cassava Mosaic ce wacce kwari ke yada ta. Ganyaye na yin rawaya da murdewa.',
      yo: 'Àrùn Cassava Mosaic ló fa àyípadà àwọ̀ ewé gbáàdùkẹ́ yín àti àìtètè gbòrò rẹ̀.',
      ig: 'Akwụkwọ akpụ gị na-acha odo odo ma na-agbakọta ọnụ n’ihi ọrịa Mosaic.',
      pcm: 'Cassava mosaic sickness don catch your cassava cassava leaves, na whitefly fly carry am.',
    },
    certifiedTreatment: 'Rogue and uproot severely infected cassava stems and burn them outside the field plot. For next planting season, strictly obtain certified CMD-tolerant varieties (TME 419 or TMS 30572) from IITA or certified seed producers.',
    organicAlternative: 'Control the whitefly insect population early by spraying mild neem leaf decoction mixed with 20ml liquid laundry soap per 10 liters of water every 7 days.',
    sprayAdvice: 'Spray lower leaf surfaces where whiteflies lay eggs in early morning.',
  },
  {
    crops: ['Rice', 'Shinkafa', 'Ìrẹsì', 'Osikapa'],
    keywords: ['blast', 'spindle', 'lesion', 'brown', 'spots', 'nchara', 'dogo', 'àbàwọ́n'],
    diagnosis: 'Rice Leaf Blast (Magnaporthe oryzae)',
    severity: 'high',
    answer: {
      en: 'Your rice field has Rice Blast fungal infection. Lesions are spindle-shaped with greyish-white centers and reddish-brown borders.',
      ha: 'Wannan cutar Rice Blast ce ta naman gwari. Tana sa ganyen shinkafa yayi tabo mai launin ruwan kasa.',
      yo: 'Àrùn fungal Rice Blast ló fa àbàwọ́n tí ó dàbí abẹ́rẹ́ lára ewé ìrẹsì yín.',
      ig: 'Ọrịa fungus a na-akpọ Rice Blast na-emebi akwụkwọ osikapa gị.',
      pcm: 'Na fungus Rice Blast sickness dey worry your rice leaves, making them get brown marks.',
    },
    certifiedTreatment: 'Apply Tricyclazole 75% WP (200g in 500L water/ha) or Azoxystrobin + Difenoconazole at the early onset of tillering. Avoid excessive late urea applications.',
    organicAlternative: 'Broadcast wood ash enriched with potassium to reinforce silica epidermal cell walls. Ensure water drainage in flooded lowland plots if water stagnates.',
    sprayAdvice: 'Spray in the morning immediately after dew dries from the rice leaves.',
  },
  {
    crops: ['Tomato', 'Tumatur', 'Tòmáatò'],
    keywords: ['tuta', 'borer', 'rotting', 'holes', 'blight', 'ihò', 'ramo'],
    diagnosis: 'Tomato Leafminer / Fruit Borer (Tuta absoluta)',
    severity: 'high',
    answer: {
      en: 'Tomato plants are attacked by Tuta absoluta or fruit borers. Larvae mine inside the leaves creating whitish galleries and bore into developing green fruits.',
      ha: "Kwari Tuta absoluta ne ke cin ganyen tumatur tare da huda 'Ya'yan tumatur.",
      yo: 'Kòkòrò Tuta absoluta ló ń jẹ ewé àti èso tòmáatò yín.',
      ig: 'Ụmụ ahụhụ Tuta absoluta na-eri akwụkwọ ma na-adụpu mkpụrụ tomato gị.',
      pcm: 'Tuta absoluta caterpillar dey bore hole inside your tomato fruits and leaves.',
    },
    certifiedTreatment: 'Spray Spinosad 450 SC (0.3ml/L) or Flubendiamide (0.5ml/L) alternating classes to prevent resistance. Apply every 7 to 10 days.',
    organicAlternative: 'Erect delta pheromone traps or yellow sticky water pans 30cm above canopy. Spray neem oil (5ml/L water + surfactant) at dusk.',
    sprayAdvice: 'Check underside of leaves and spray before flowers fully open.',
  },
  {
    crops: ['Cowpea', 'Beans', 'Wake', 'Ẹ̀wà', 'Agwa'],
    keywords: ['maruca', 'pod borer', 'aphids', 'flower', 'drop', 'fure'],
    diagnosis: 'Cowpea Pod Borer (Maruca vitrata) & Aphid Complex',
    severity: 'medium',
    answer: {
      en: 'Cowpea is affected by flower thrips and Maruca pod borers causing flower abortion and webbed floral clusters with black frass.',
      ha: 'Kwaron wake na Maruca ne ke zubar da furen wake da cin wake.',
      yo: 'Kòkòrò ń jẹ òdòdó ẹ̀wà yín tí kò jẹ́ kí ó so èso dáadáa.',
      ig: 'Ụmụ ahụhụ na-eri ifuru agwa gị ma na-eme ka ọ ghara ịmị mkpụrụ.',
      pcm: 'Maruca caterpillar and black aphids dey make your beans flower drop before pod grow.',
    },
    certifiedTreatment: 'Spray Lambda-cyhalothrin 2.5% EC (1L/ha) at flower bud initiation (day 35–40) and repeat at 50% flowering.',
    organicAlternative: 'Spray 5% aqueous neem seed kernel extract (NSKE) early morning during flowering stage.',
    sprayAdvice: 'Do not spray when honeybees are foraging on cowpea flowers (10:00 AM–2:00 PM).',
  },
];

// Fallback general advice if no exact match is found
const GENERAL_ADVICE = {
  diagnosis: 'General Field Crop Health & Nutrient Screening',
  severity: 'low',
  answer: {
    en: 'Based on your field description, ensure balanced soil moisture and scout leaves for insect frass or discoloration. Split nitrogen top-dressing to prevent leaching.',
    ha: 'Bisa bayanin gonar, a tabbatar da cewa kasar tana da danshi mai kyau kuma a duba ganyaye don kwari.',
    yo: 'Ẹ rii dájú pé ilẹ̀ ní omi tó tó, kí ẹ sì yẹ ewé wò fún kòkòrò.',
    ig: 'Hụ na ala nwere mmiri zuru oke ma lelee akwụkwọ maka ahụhụ.',
    pcm: 'Make sure your farm soil get enough water, check under the leaf for any insect or yellow color.',
  },
  certifiedTreatment: 'Apply balanced NPK 15-15-15 or NPK 20-10-10 at root zone, 5-7cm away from crop base.',
  organicAlternative: 'Incorporate well-cured compost or poultry manure around the plant bed to stimulate beneficial soil microbes.',
  sprayAdvice: 'Favorable spraying window: calm savanna mornings (7:00–10:00 AM) with wind under 10 km/h.',
};

/**
 * Perform diagnosis query: tries online API first, falls back instantly to offline encyclopedic matcher.
 */
export async function consultZora({ message, language = 'en', crop = 'Maize', region = 'Kano' }) {
  const cleanMsg = (message || '').trim();

  // 1. Try online Zora API if endpoint reachable
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${ZORA_BASE_URL}/api/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: cleanMsg,
        language: language,
        crop: crop,
        region: region,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        online: true,
        diagnosis: data.diagnosis || 'Agricultural Advisory',
        severity: data.severity || 'medium',
        spokenText: data.spoken || data.explanation,
        explanation: data.explanation || data.spoken,
        steps: data.steps || [],
        organicAlternative: data.organicAlternative,
        safety: data.safety || 'Ensure safe spraying equipment.',
        sources: data.sources || ['CCSA KGML-Ag', 'Cosmopolitan University'],
      };
    }
  } catch (err) {
    // network timeout or device offline — proceed to offline engine
  }

  // 2. Offline Agronomic Engine
  const lowerMsg = cleanMsg.toLowerCase();
  const lowerCrop = (crop || '').toLowerCase();

  const match = LOCAL_AGRONOMIC_ENCYCLOPEDIA.find((item) => {
    const cropMatches = item.crops.some((c) => lowerCrop.includes(c.toLowerCase()));
    const keywordMatches = item.keywords.some((k) => lowerMsg.includes(k.toLowerCase()));
    return cropMatches || keywordMatches;
  }) || GENERAL_ADVICE;

  const textInLang =
    match.answer[language] || match.answer.en || match.answer.ha;

  return {
    online: false,
    diagnosis: match.diagnosis,
    severity: match.severity,
    spokenText: textInLang,
    explanation: textInLang,
    steps: [match.certifiedTreatment],
    organicAlternative: match.organicAlternative,
    safety: match.sprayAdvice,
    sources: ['CCSA Offline Agronomic Cache', 'IITA Savanna Protocol'],
  };
}

/**
 * Text-to-speech helper with locale mapping
 */
export async function playZoraSpeech(text, language = 'en') {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
      return false;
    }

    const localeMap = {
      en: 'en-NG',
      ha: 'ha-NG',
      yo: 'yo-NG',
      ig: 'ig-NG',
      pcm: 'en-NG',
    };

    const targetLocale = localeMap[language] || 'en-NG';

    Speech.speak(text, {
      language: targetLocale,
      pitch: 1.0,
      rate: 0.9,
    });
    return true;
  } catch (err) {
    console.warn('[ZoraSpeech] Speech playback warning:', err);
    return false;
  }
}
