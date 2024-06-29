import { useEffect, useRef, useState } from "react";
import "../App.css";
import Styles from "./Editor.module.css";

import axios, { AxiosError } from "axios";

interface FontStyleData {
  [key: string]: {
    [key: string]: string; // Assuming each variant points to a URL string
  };
}

const TextEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontStylesData, setFontStylesData] = useState<FontStyleData>({});
  const [fontStylesTypes, setFontStylesTypes] = useState<string[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>("");
  const [allVariants, setAllVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [isToggled, setIsToggled] = useState<boolean>(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // State for storing fetch error

  useEffect(() => {
    const getFontStyles = async () => {
      try {
        const fontData = await axios.get("/fonts.json");
        const data: FontStyleData = fontData.data;
        const allStylesFamilyType = Object.keys(data);

        if (
          localStorage.getItem("selectedFont") &&
          data[localStorage.getItem("selectedFont") || ""]
        ) {
          const allVariants = Object.keys(
            data[localStorage.getItem("selectedFont") || ""]
          );
          let count = 0;
          allVariants.forEach((variant) => {
            if (variant.endsWith("italic")) {
              count++;
            }
          });
          setIsToggleEnabled(count > 0);
          setAllVariants(allVariants);
        }

        setFontStylesData(data);
        setFontStylesTypes(allStylesFamilyType);
        setFetchError(null); // Clear fetch error state on successful fetch
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response) {
            console.error("Request made, but server responded with status:", axiosError.response.status);
            console.error("Error data:", axiosError.response.data);
          } else if (axiosError.request) {
            console.error("Request made, but no response received:", axiosError.request);
          } else {
            console.error("Error setting up request:", axiosError.message);
          }
        } else {
          console.log("Unexpected error occurred:");
        }
        setFetchError("Failed to fetch font data."); // Set fetch error state
      }
    };

    getFontStyles();
  }, []);

  const handleSelectFont = (styleKey: string) => {
    setSelectedFont(styleKey);
    if (styleKey && fontStylesData[styleKey]) {
      const variants = Object.keys(fontStylesData[styleKey]);
      let count = 0;
      variants.forEach((variant) => {
        if (variant.endsWith("italic")) {
          count++;
        }
      });
      setIsToggleEnabled(count > 0);
      setAllVariants(variants);
      setSelectedVariant(variants[0]);
      localStorage.setItem("selectedFont", styleKey);
      localStorage.setItem("selectedVariant", variants[0]);
    } else {
      setAllVariants([]);
    }
  };

  const handleSelectVariant = (variant: string) => {
    setSelectedVariant(variant);
    setIsToggled(variant.endsWith("italic"));
    localStorage.setItem("selectedVariant", variant);
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.fontFamily = `${selectedFont}, sans-serif`;
    }
  }, [selectedFont]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.textContent = localStorage.getItem("content") || "";
    }
    const storedVariant = localStorage.getItem("selectedVariant") || "";
    setSelectedVariant(storedVariant);
    setIsToggled(storedVariant.endsWith("italic"));
  }, []);

  const handleToggle = () => {
    if (isToggleEnabled) {
      const targetVariant = allVariants.find((variant) =>
        isToggled ? !variant.endsWith("italic") : variant.endsWith("italic")
      );
      if (targetVariant) {
        setSelectedVariant(targetVariant);
        localStorage.setItem("selectedVariant", targetVariant);
      }
      setIsToggled(!isToggled);
    }
  };

  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.textContent = "";
    }
    setIsToggled(false);
    setSelectedFont("");
    setSelectedVariant("");
    localStorage.removeItem("content");
    localStorage.removeItem("selectedFont");
    localStorage.removeItem("selectedVariant");
  };

  const handleSave = () => {
    localStorage.setItem("selectedFont", selectedFont);
    localStorage.setItem("selectedVariant", selectedVariant);
  };

  const customFontStyle =
    fontStylesTypes.length > 0 &&
    selectedFont &&
    selectedVariant &&
    `
    @font-face {
      font-family: '${selectedFont}';
      src: url(${fontStylesData[selectedFont][selectedVariant]}) format('woff2');
      font-weight: normal;
      font-style: normal;
    }
  `;

  return (
    <div>
      {fetchError && <div>Error: {fetchError}</div>}
      <style>{customFontStyle}</style>
      <h2 className={Styles.textEditorHeading}>Text Editor</h2>
      <div>
        <div className={Styles.selectorDivWrapper}>
          <div className={Styles.selectorDiv}>
            <span>font family</span>
            <select
              value={selectedFont}
              onChange={(e) => handleSelectFont(e.target.value)}
            >
              <option value="">select font</option>
              {fontStylesTypes.map((style, index) => (
                <option value={style} key={index}>
                  {style}
                </option>
              ))}
            </select>
          </div>
          <div className={Styles.selectorDiv}>
            <span>variant</span>
            <select
              value={selectedVariant}
              onChange={(e) => handleSelectVariant(e.target.value)}
              disabled={!selectedFont}
            >
              {!selectedFont && <option value="">select variant</option>}
              {allVariants.map((variant, index) => (
                <option value={variant} key={index}>
                  {variant}
                </option>
              ))}
            </select>
          </div>
          <div className={Styles.toggleSwitch} onClick={handleToggle}>
            <div
              className={`${Styles.switch} ${isToggled ? Styles.on : Styles.off}`}
              style={{ backgroundColor: isToggleEnabled ? "" : "rgb(230, 223, 223)" }}
            />
          </div>
        </div>
        <div ref={editorRef} contentEditable className={Styles.editor} />
      </div>
      <div className={Styles.bottomButtons}>
        <button onClick={handleReset}>Clear</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default TextEditor;
