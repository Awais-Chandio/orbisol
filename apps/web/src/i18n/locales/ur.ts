/**
 * Orbisol - Urdu strings (Field screen, Overview plain sentences, nav labels, and the buttons on those screens).
 *
 * DRAFT - NEEDS NATIVE REVIEW. Machine-assisted draft (Claude, Anthropic), not yet checked by a native Urdu speaker.
 * Every string below is a draft. Keys missing here fall back to English.
 * Numbers, ranges and units sit in U+2066..U+2069 (left-to-right isolate) so '11–27' and '42.5 °C' keep their order.
 * Sentences that open with an English crop name start with U+200F (right-to-left mark) so they lay out right to left.
 * Place search matches English (GeoNames) names, so its hint asks for English letters.
 */
const ur = {
  nav: {
    field: 'کھیت',
    farm: 'میرا فارم',
    overview: 'خلاصہ',
    rotations: 'فصلی چکر',
    calendar: 'کیلنڈر',
    season: 'موسم',
    about: 'تعارف اور ڈیٹا کے حوالے',
  },
  lang: { switchTo: 'English', label: 'Language: Urdu. Switch to English' },
  notice: {
    judgment: 'اوربیسول آپ کے فیصلے اور مقامی تجربے کی مدد کرتا ہے، ان کی جگہ نہیں لیتا۔',
  },
  field: {
    title: 'اپنا کھیت منتخب کریں',
    value: 'ناسا کے 25 سال کے سیٹلائٹ ڈیٹا اور 30 سال کے موسمی ریکارڈ سے اپنے کھیت کے لیے فصلوں کی ترتیب کا موازنہ کریں۔',
    stepsLabel: 'یہ کیسے کام کرتا ہے',
    steps: { '0': 'اپنا کھیت منتخب کریں', '1': 'بتائیں آپ کیسے کاشت کرتے ہیں', '2': 'اپنے اختیارات دیکھیں' },
    useGps: 'میری موجودہ جگہ استعمال کریں',
    locating: 'آپ کی جگہ تلاش ہو رہی ہے…',
    useDemo: 'ٹنڈو جام، حیدرآباد کے قریب نمونہ فارم',
    useDemo2: 'نمونہ: فیصل آباد، پنجاب (ناسا کا تازہ ڈیٹا)',
    tapHint: 'نقشے پر ٹیپ کریں یا پن کو اپنے کھیت تک کھینچیں۔',
    manualTitle: 'یا کوآرڈینیٹس لکھیں',
    lat: 'عرض بلد (Latitude)',
    lon: 'طول بلد (Longitude)',
    setPin: 'پن لگائیں',
    invalid: 'عرض بلد -90 سے 90 اور طول بلد -180 سے 180 کے درمیان لکھیں۔',
    pinned: 'کھیت منتخب ہو گیا',
    noPin: 'ابھی کوئی کھیت منتخب نہیں ہوا۔',
    accuracy: 'جی پی ایس کی درستگی تقریباً {{m}} میٹر',
    mapLoading: 'نقشہ لوڈ ہو رہا ہے…',
    mapError: 'نقشہ لوڈ نہیں ہو سکا۔ آپ پھر بھی کوآرڈینیٹس لکھ سکتے ہیں یا جی پی ایس استعمال کر سکتے ہیں۔',
    source: { gps: 'جی پی ایس سے', map: 'نقشے سے', manual: 'لکھ کر', demo: 'نمونہ کھیت', search: 'تلاش سے' },
    gpsError: {
      unsupported: 'اس فون میں جی پی ایس کی سہولت نہیں۔ نقشے پر ٹیپ کریں۔',
      denied: 'جگہ کی اجازت نہیں دی گئی۔ نقشے پر ٹیپ کریں یا کوآرڈینیٹس لکھیں۔',
      unavailable: 'آپ کی جگہ معلوم نہیں ہو سکی۔ نقشے پر ٹیپ کریں۔',
      timeout: 'جی پی ایس نے بہت وقت لیا۔ کھلی جگہ پر دوبارہ کوشش کریں یا نقشے پر ٹیپ کریں۔',
    },
    searchLabel: 'اپنا شہر یا گاؤں تلاش کریں',
    searchPlaceholder: 'مثلاً Tando Jam',
    searchHint: 'انگریزی حروف میں کم از کم 2 حروف لکھیں۔',
    searching: 'تلاش جاری ہے…',
    searchMore: 'بہت سی جگہیں اسی طرح شروع ہوتی ہیں۔ کچھ اور حروف لکھیں۔',
    searchNone: 'کوئی جگہ نہیں ملی۔ دوسرے ہجے آزمائیں یا نقشے پر ٹیپ کریں۔',
    searchError: 'جگہ کی تلاش ابھی دستیاب نہیں۔ نقشے پر ٹیپ کریں یا جی پی ایس استعمال کریں۔',
    searchResults: 'ملنے والی جگہیں',
    kmAway: 'موجودہ پن سے {{km}} کلومیٹر',
  },
  overview: {
    judgment: 'یہ آپ کے فیصلے کی مدد کرتا ہے، اس کی جگہ نہیں لیتا۔',
    season: {
      hot: { above: 'معمول سے زیادہ گرم دن', near: 'معمول کے مطابق گرم دن', below: 'معمول سے کم گرم دن', none: 'گرم دن: ڈیٹا کافی نہیں' },
      rain: { above: 'معمول سے زیادہ بارش', near: 'معمول کے مطابق بارش', below: 'معمول سے کم بارش', none: 'بارش: ڈیٹا کافی نہیں' },
    },
  },
  plain: {
    bareHot_one: '{{count}} گرم دن کھیت خالی رہتا ہے: دھوپ اور ہوا اوپر کی زرخیز مٹی اڑا لے جاتی ہیں۔',
    bareHot_other: '{{count}} گرم دن کھیت خالی رہتا ہے: دھوپ اور ہوا اوپر کی زرخیز مٹی اڑا لے جاتی ہیں۔',
    bareCovered: 'سب سے گرم مہینوں میں آپ کے کھیت میں فصل کھڑی رہتی ہے۔',
    turnsSaved: '\u200F{{crops}} سے تقریباً ہر {{n}} میں سے 1 نہری باری بچتی ہے (\u2066{{pct}}%\u2069 کم پانی)۔',
    turnsExtra: '\u200F{{crops}} کو ہر {{n}} نہری باریوں پر تقریباً 1 اضافی باری چاہیے (\u2066{{pct}}%\u2069 زیادہ پانی)۔',
    waterLess: '\u200F{{crops}} کو اب سے تھوڑا کم پانی چاہیے (\u2066{{pct}}%\u2069 کم)۔',
    waterMore: '\u200F{{crops}} کو اب سے تھوڑا زیادہ پانی چاہیے (\u2066{{pct}}%\u2069 زیادہ)۔',
    waterSame: '\u200F{{crops}} کو تقریباً اتنا ہی پانی چاہیے جتنا اب۔',
    existingFirst: 'آپ کی موجودہ فصلی ترتیب پہلے ہی آپ کی ترجیحات کے لیے سب سے بہتر ہے۔',
    season: '{{period}}: {{hot}}، {{rain}}۔',
    last3: 'پچھلے 3 مہینے',
    last1: 'پچھلا مہینہ',
    heat2050: '{{year}} کے آس پاس ہر سال \u2066{{t}} °C\u2069 سے زیادہ گرمی والے \u2066{{v}}\u2069 مزید دن متوقع ہیں۔',
  },
  listen: { play: 'سنیں', stop: 'روکیں', then: 'پھر', to: 'سے' },
  science: { show: 'سائنس دکھائیں', hide: 'سائنس چھپائیں' },
  season: { groups: { jump: 'گروپ پر جائیں', heat: 'گرمی', water: 'پانی', soil: 'مٹی اور ہریالی', frost: 'پالا' } },
  next: { aria: 'اگلا قدم', label: 'اگلا قدم: {{screen}}', back: 'خلاصے پر واپس' },
};

export default ur;
