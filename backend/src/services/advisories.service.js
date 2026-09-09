// Rule-based fertilizer & irrigation advisories.
// This generates agronomic advice from crop + soil + weather inputs.

const CROP_WATER_NEED = {
  'ধান': 'উঁচু (খেতে স্থায়ী পানি বজায় রাখুন)',
  'গম': 'মাঝারি (১০-১২ দিন পর পর সেচ)',
  'ভুট্টা': 'মাঝারি (৮-১০ দিন পর পর সেচ)',
  'আলু': 'মাঝারি (৭-৮ দিন পর পর সেচ)',
  'চা': 'কম (বৃষ্টি নির্ভর)',
};

export function fertilizerAdvice(soil, crop) {
  const advice = [];
  const name = crop?.name || '';
  if (!soil) {
    advice.push('এই জমিতে মৃত্তিকা পরীক্ষা সম্পন্ন হয়নি। পরীক্ষা করে সারের পরামর্শ নিন।');
    advice.push('জৈব সার (গোবর/কম্পোস্ট) প্রতি বিঘায় ৩০০-৪০০ কেজি প্রয়োগ করুন।');
    return advice;
  }
  const n = Number(soil.nitrogen);
  const p = Number(soil.phosphorus);
  const k = Number(soil.potassium);
  const ph = Number(soil.ph);

  if (ph < 5.5) advice.push('মাটির pH কম। চুন/ডলোমাইট প্রতি বিঘায় ২০-৩০ কেজি প্রয়োগ করুন।');
  if (ph > 7.5) advice.push('মাটির pH বেশি। জৈব সার ও গন্ধক-যুক্ত সার প্রয়োগ করুন।');
  if (n != null && n < 0.3) advice.push('নাইট্রোজেন কম। ইউরিয়া প্রতি বিঘায় ৩৫-৪০ কেজি প্রয়োগ করুন।');
  if (p != null && p < 10) advice.push('ফসফরাস কম। টিএসপি প্রতি বিঘায় ২৫-৩০ কেজি প্রয়োগ করুন।');
  if (k != null && k < 60) advice.push('পটাশিয়াম কম। এমওপি প্রতি বিঘায় ২০-২৫ কেজি প্রয়োগ করুন।');
  if (soil.organic_matter != null && Number(soil.organic_matter) < 1.8) {
    advice.push('জৈব পদার্থ কম। গোবর/ভার্মি কম্পোস্ট প্রতি বিঘায় ৩০০-৪০০ কেজি দিন।');
  }
  if (!advice.length) advice.push('মৃত্তিকা পুষ্টির মাত্রা সন্তোষজনক। নির্ধারিত মাত্রায় সার প্রয়োগ চালিয়ে যান।');
  if (name) advice.push(`${name} চাষের জন্য সারের প্রয়োগ ২-৩ কিস্তিতে ভাগ করে দিন।`);
  return advice;
}

export function irrigationAdvice(crop, land, weather) {
  const advice = [];
  const name = crop?.name || '';
  const water = CROP_WATER_NEED[name] || 'মাঝারি';
  advice.push(`পানির প্রয়োজন: ${water}`);
  if (weather && Number(weather.rainfall_mm) > 15) {
    advice.push('আগামী সময়ে বৃষ্টির সম্ভাবনা আছে, সেচ কমিয়ে দিন।');
  } else if (weather && Number(weather.rainfall_mm) > 0) {
    advice.push('হালকা বৃষ্টি হয়েছে, প্রয়োজন হলে সেচ কমান।');
  } else {
    advice.push('বৃষ্টিপাত কম — নির্ধারিত সময়ে সেচ দিন।');
  }
  if (land?.irrigation_source) {
    advice.push(`সেচের উৎস: ${land.irrigation_source}`);
  }
  return advice;
}
