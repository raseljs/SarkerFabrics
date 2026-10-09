"use client";
import { useEffect, useId, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import styles from "./review-media.module.css";
export type ReviewAttachment = { type:"image"|"video"; url:string; name?:string };
const allowed = new Set(["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/webm","video/ogg"]);
export default function ReviewMediaPicker({files,onChange,disabled}:{files:File[];onChange:(files:File[])=>void;disabled:boolean}) {
  const id=useId();const [error,setError]=useState("");const [previews,setPreviews]=useState<string[]>([]);
  useEffect(()=>{const urls=files.map(file=>URL.createObjectURL(file));setPreviews(urls);return()=>urls.forEach(url=>URL.revokeObjectURL(url));},[files]);
  function choose(selected:File[]) {
    setError("");const next=[...files,...selected];
    if(next.length>5){setError("Choose up to 5 files in total.");return;}
    if(next.filter(file=>file.type.startsWith("video/")).length>1){setError("Choose only one video per review.");return;}
    for(const file of selected){if(!allowed.has(file.type)){setError("Use JPG, PNG, GIF, WebP, MP4, WebM or OGG files.");return;}if(file.size>(file.type.startsWith("video/")?25:5)*1024*1024){setError(`${file.name}: photos must be 5MB or smaller; videos 25MB or smaller.`);return;}}
    onChange(next);
  }
  return <div className={styles.picker}><label htmlFor={id}>Photos &amp; video <span>(optional)</span></label><p>Up to 5 files • Photos: 5MB each • One video: 25MB</p><label className={styles.upload} aria-disabled={disabled} htmlFor={id}><ImagePlus size={22}/><span>Add photos or video</span><input id={id} type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg" multiple disabled={disabled} aria-label="Add review photos or video" onChange={event=>{choose(Array.from(event.target.files||[]));event.target.value="";}}/></label>{error&&<p role="alert" className={styles.error}>{error}</p>}{files.length>0&&<div className={styles.previews}>{files.map((file,index)=><div className={styles.preview} key={`${file.name}-${file.lastModified}-${index}`}>{previews[index]&&(file.type.startsWith("video/")?<video src={previews[index]} controls preload="metadata" playsInline/>:<img src={previews[index]} alt={`Preview of ${file.name}`}/>)}<span title={file.name}>{file.name}</span><button type="button" disabled={disabled} aria-label={`Remove ${file.name}`} onClick={()=>{setError("");onChange(files.filter((_,i)=>i!==index));}}><X size={16}/></button></div>)}</div>}</div>;
}
export function ReviewMediaGallery({media}:{media?:ReviewAttachment[]}) {
  if(!media?.length)return null;
  return <div className={styles.gallery}>{media.map((item,index)=>item.type==="video"?<video key={item.url} src={item.url} controls playsInline preload="metadata" aria-label={`Review video ${index+1}`}/>:<a key={item.url} href={item.url} target="_blank" rel="noreferrer"><img src={item.url} loading="lazy" alt={`Customer review photo ${index+1}`}/></a>)}</div>;
}
