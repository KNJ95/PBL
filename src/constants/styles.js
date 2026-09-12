import { C } from "./theme";
import { LEVEL_COLOR } from "./axes";

// ─── 共通スタイル定数 ──────────────────────────────────────────────────────
export const S = {
  card:       { background:C.surface,  border:`1px solid ${C.border}`,       borderRadius:14, padding:"1.25rem",      marginBottom:"0.875rem" },
  cardGlow:   { background:C.surface,  border:`1px solid ${C.primary}44`,    borderRadius:14, padding:"1.25rem",      marginBottom:"0.875rem", boxShadow:`0 0 24px ${C.primary}18` },
  scard:      { background:C.surface2, border:`1px solid ${C.border}`,       borderRadius:10, padding:"0.875rem 1rem",marginBottom:"0.5rem" },
  btn:        { cursor:"pointer", padding:"7px 18px",  borderRadius:9, border:`1px solid ${C.border}`, background:"transparent",                                        color:C.text,  fontSize:13, fontFamily:"inherit", transition:"all 0.15s" },
  btnPrimary: { cursor:"pointer", padding:"8px 20px",  borderRadius:9, border:"none",                  background:`linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color:"#fff",  fontSize:13, fontFamily:"inherit", fontWeight:600, boxShadow:`0 4px 14px ${C.primary}44` },
  btnSuccess: { cursor:"pointer", padding:"8px 20px",  borderRadius:9, border:"none",                  background:C.success,                                            color:"#000",  fontSize:13, fontFamily:"inherit", fontWeight:600 },
  input:      { width:"100%", padding:"10px 13px", borderRadius:9, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" },
  textarea:   { width:"100%", padding:"10px 13px", borderRadius:9, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:16, fontFamily:"inherit", resize:"vertical", minHeight:72, outline:"none", boxSizing:"border-box" },
  badge:      (lv) => ({ display:"inline-block", padding:"2px 10px", borderRadius:6, background:LEVEL_COLOR[lv]+"22", color:LEVEL_COLOR[lv], fontSize:11, fontWeight:600, border:`1px solid ${LEVEL_COLOR[lv]}44` }),
  navBtn:     (a)  => ({ cursor:"pointer", padding:"7px 15px",  borderRadius:8, border:`1px solid ${a?C.primary:C.border}`, background:a?C.primary+"22":"transparent", color:a?C.primary:C.textSub, fontSize:13, fontFamily:"inherit", fontWeight:a?700:400, transition:"all 0.15s" }),
  tag:        (c)  => ({ display:"inline-block", padding:"2px 9px",  borderRadius:6, background:c+"22", color:c, fontSize:11, fontWeight:600, border:`1px solid ${c}44` }),
};
