"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "tr" | "en";

export const dict = {
  en: {
    // header
    title: "CleanData",
    subtitle: "Remove hidden metadata before sharing.",
    // top controls
    backToWaweup: "waweup.com",
    backAria: "Back to waweup.com",
    langAria: "Language",
    themeToDark: "Switch to dark theme",
    themeToLight: "Switch to light theme",
    // drop zone
    dropHere: "Drop a file here",
    or: "or",
    chooseFile: "choose a file",
    processedLocally: "Processed locally whenever possible.",
    // errors
    errUnsupported: "Unsupported file type. JPG, PNG and WebP are supported.",
    errRead: "Could not read this file.",
    errClean: "Something went wrong while cleaning this file.",
    // file row / inspect
    remove: "Remove",
    reading: "Reading metadata…",
    metadataFound: "Metadata found",
    noMetadataFound: "No metadata found",
    fieldOne: "1 metadata field",
    fieldMany: "{n} metadata fields",
    // metadata rows
    rowGps: "GPS Location",
    rowDevice: "Device",
    rowCamera: "Camera",
    rowTaken: "Taken",
    rowSoftware: "Software",
    rowAuthor: "Author",
    rowExif: "EXIF",
    found: "Found",
    // actions
    cleanBtn: "Clean Metadata",
    cleaning: "Cleaning…",
    // done
    removedTitle: "Metadata removed",
    before: "Before",
    after: "After",
    someRemain: "Some metadata could not be removed.",
    downloadBtn: "Download Clean File",
    cleanAnotherBtn: "Clean Another File",
    // faq
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "What metadata does CleanData remove?",
        a: "CleanData strips hidden EXIF data embedded in your photos — GPS location, capture timestamps, device and camera model, software used, and author information. What remains is just the image itself.",
      },
      {
        q: "Are my files uploaded anywhere?",
        a: "No. Everything runs entirely in your browser. Your files are read and cleaned on your own device and never leave it — nothing is sent to a server.",
      },
      {
        q: "Which file formats are supported?",
        a: "CleanData currently supports JPG, PNG and WebP images. Drop a file in one of these formats and it will be inspected instantly.",
      },
      {
        q: "Is CleanData free?",
        a: "Yes. CleanData is a free tool by waweup. There is no sign-up, no limit and no watermark.",
      },
      {
        q: "Is my original file changed?",
        a: "No. Your original file stays untouched. CleanData creates a new copy with “-clean” added to the file name, and you download that copy.",
      },
    ],
    // footer
    footer: "A waweup. tool — your files never leave your device.",
  },
  tr: {
    // header
    title: "CleanData",
    subtitle: "Paylaşmadan önce gizli meta verileri kaldırın.",
    // top controls
    backToWaweup: "waweup.com",
    backAria: "waweup.com'a geri dön",
    langAria: "Dil",
    themeToDark: "Koyu temaya geç",
    themeToLight: "Açık temaya geç",
    // drop zone
    dropHere: "Dosyanızı buraya bırakın",
    or: "veya",
    chooseFile: "dosya seçin",
    processedLocally: "Mümkün olduğunda cihazınızda yerel olarak işlenir.",
    // errors
    errUnsupported:
      "Desteklenmeyen dosya türü. JPG, PNG ve WebP desteklenmektedir.",
    errRead: "Bu dosya okunamadı.",
    errClean: "Bu dosya temizlenirken bir sorun oluştu.",
    // file row / inspect
    remove: "Kaldır",
    reading: "Meta veriler okunuyor…",
    metadataFound: "Meta veri bulundu",
    noMetadataFound: "Meta veri bulunamadı",
    fieldOne: "1 meta veri alanı",
    fieldMany: "{n} meta veri alanı",
    // metadata rows
    rowGps: "GPS Konumu",
    rowDevice: "Cihaz",
    rowCamera: "Kamera",
    rowTaken: "Çekim Tarihi",
    rowSoftware: "Yazılım",
    rowAuthor: "Yazar",
    rowExif: "EXIF",
    found: "Bulundu",
    // actions
    cleanBtn: "Meta Verileri Temizle",
    cleaning: "Temizleniyor…",
    // done
    removedTitle: "Meta veriler kaldırıldı",
    before: "Önce",
    after: "Sonra",
    someRemain: "Bazı meta veriler kaldırılamadı.",
    downloadBtn: "Temiz Dosyayı İndir",
    cleanAnotherBtn: "Başka Bir Dosya Temizle",
    // faq
    faqTitle: "Sıkça sorulan sorular",
    faq: [
      {
        q: "CleanData hangi meta verileri kaldırır?",
        a: "CleanData, fotoğraflarınıza gömülü gizli EXIF verilerini temizler — GPS konumu, çekim tarihi ve saati, cihaz ve kamera modeli, kullanılan yazılım ve yazar bilgileri. Geriye yalnızca görüntünün kendisi kalır.",
      },
      {
        q: "Dosyalarım bir yere yükleniyor mu?",
        a: "Hayır. Her şey tamamen tarayıcınızda çalışır. Dosyalarınız kendi cihazınızda okunur ve temizlenir, cihazınızdan asla ayrılmaz — hiçbir şey bir sunucuya gönderilmez.",
      },
      {
        q: "Hangi dosya formatları destekleniyor?",
        a: "CleanData şu anda JPG, PNG ve WebP görsellerini destekliyor. Bu formatlardan birinde bir dosya bırakın, anında incelensin.",
      },
      {
        q: "CleanData ücretsiz mi?",
        a: "Evet. CleanData, waweup tarafından sunulan ücretsiz bir araçtır. Kayıt yok, sınır yok, filigran yok.",
      },
      {
        q: "Orijinal dosyam değişiyor mu?",
        a: "Hayır. Orijinal dosyanız olduğu gibi kalır. CleanData, dosya adına “-clean” eklenmiş yeni bir kopya oluşturur ve siz bu kopyayı indirirsiniz.",
      },
    ],
    // footer
    footer: "Bir waweup. aracı — dosyalarınız cihazınızdan asla ayrılmaz.",
  },
} as const;

type Dict = (typeof dict)[Lang];

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <SiteChrome>");
  return ctx;
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    let initial: Lang = "en";
    try {
      const stored = localStorage.getItem("waweup-lang");
      if (stored === "tr" || stored === "en") {
        initial = stored;
      } else if (navigator.language?.toLowerCase().startsWith("tr")) {
        initial = "tr";
      }
    } catch {
      // ignore storage access errors
    }
    setLangState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem("waweup-lang", next);
    } catch {
      // ignore storage access errors
    }
    document.documentElement.lang = next;
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: dict[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const SEGMENT_ACTIVE =
  "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium bg-[#ff6903] text-white";
const SEGMENT_INACTIVE =
  "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium text-secondary transition-colors duration-150 hover:bg-hover";

export function TopControls() {
  const { lang, setLang, t } = useI18n();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("waweup-theme", next ? "dark" : "light");
    } catch {
      // ignore storage access errors
    }
    setIsDark(next);
  }, []);

  return (
    <header className="flex w-full items-center gap-2 py-2">
      <div className="flex items-center gap-2">
        <a
          href="https://waweup.com"
          aria-label={t.backAria}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-secondary transition-colors duration-150 hover:bg-hover hover:text-foreground"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9.5 3.5L5 8l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">{t.backToWaweup}</span>
        </a>

        <div
          role="group"
          aria-label={t.langAria}
          className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-border p-1"
        >
          <button
            type="button"
            onClick={() => setLang("tr")}
            aria-pressed={lang === "tr"}
            className={lang === "tr" ? SEGMENT_ACTIVE : SEGMENT_INACTIVE}
          >
            TR
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            className={lang === "en" ? SEGMENT_ACTIVE : SEGMENT_INACTIVE}
          >
            EN
          </button>
        </div>
      </div>

      <div className="flex flex-1 justify-center">
        <a
          href="/"
          aria-label="waweup"
          className="inline-flex items-center rounded-md text-lg font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>wawe</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6903"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="ml-[2px] size-[0.85em] -translate-y-[0.06em] -rotate-12"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </a>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? t.themeToLight : t.themeToDark}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-secondary transition-colors duration-150 hover:bg-hover hover:text-foreground"
      >
        {isDark ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="3.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 1.5v1.5M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1.06 1.06M4.46 11.54L3.4 12.6M12.6 12.6l-1.06-1.06M4.46 4.46L3.4 3.4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </header>
  );
}
