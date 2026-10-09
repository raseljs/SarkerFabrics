"use client";

import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styles from './product-hover-zoom.module.css';

type Zoom = {
  left: number; top: number; width: number; height: number;
  imageWidth: number; imageHeight: number; offsetX: number; offsetY: number;
  lensX: number; lensY: number; lensWidth: number; lensHeight: number;
  fit: string; position: string; imageSrc: string;
};
const MAGNIFICATION = 2.5;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export default function ProductHoverZoom({ container, image, src, name }: {
  container: RefObject<HTMLDivElement | null>;
  image: RefObject<HTMLImageElement | null>;
  src: string | null;
  name: string;
}) {
  const [zoom, setZoom] = useState<Zoom | null>(null);
  useEffect(() => {
    setZoom(null);
    const target = container.current;
    if (!target || !src) return;
    const desktop = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
    let frame = 0;
    const hide = () => { cancelAnimationFrame(frame); setZoom(null); };
    const move = (event: PointerEvent) => {
      if (!desktop.matches || event.pointerType !== 'mouse' || !image.current?.complete || !image.current.naturalWidth) return hide();
      const { clientX, clientY } = event;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const displayedImage = image.current;
        if (!displayedImage?.complete || !displayedImage.naturalWidth) return hide();
        const box = target.getBoundingClientRect();
        const left = box.right + 18;
        const width = Math.min(640, window.innerWidth - left - 18);
        const height = Math.min(box.height, window.innerHeight - 32);
        if (width < 220 || height < 180 || box.width <= 0 || box.height <= 0) return hide();
        const lensWidth = Math.min(box.width, width / MAGNIFICATION);
        const lensHeight = Math.min(box.height, height / MAGNIFICATION);
        const lensX = clamp(clientX - box.left - lensWidth / 2, 0, box.width - lensWidth);
        const lensY = clamp(clientY - box.top - lensHeight / 2, 0, box.height - lensHeight);
        const style = getComputedStyle(displayedImage);
        setZoom({
          left, top: clamp(box.top, 16, window.innerHeight - height - 16), width, height,
          imageWidth: box.width * MAGNIFICATION, imageHeight: box.height * MAGNIFICATION,
          offsetX: -lensX * MAGNIFICATION, offsetY: -lensY * MAGNIFICATION,
          lensX, lensY, lensWidth, lensHeight, fit: style.objectFit, position: style.objectPosition,
          imageSrc: displayedImage.currentSrc || displayedImage.src,
        });
      });
    };
    target.addEventListener('pointerenter', move);
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerleave', hide);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    desktop.addEventListener('change', hide);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener('pointerenter', move);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerleave', hide);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      desktop.removeEventListener('change', hide);
    };
  }, [container, image, src]);

  if (!zoom || !src) return null;
  return <>
    <div aria-hidden="true" className={styles.lens} style={{ left: zoom.lensX, top: zoom.lensY, width: zoom.lensWidth, height: zoom.lensHeight }}/>
    {createPortal(<div className={styles.panel} role="img" aria-label={`Magnified view of ${name}`} style={{ left: zoom.left, top: zoom.top, width: zoom.width, height: zoom.height }}>
      <img src={zoom.imageSrc} alt="" draggable={false} className={styles.image} style={{ width: zoom.imageWidth, height: zoom.imageHeight, transform: `translate(${zoom.offsetX}px, ${zoom.offsetY}px)`, objectFit: zoom.fit as 'cover' | 'contain', objectPosition: zoom.position }}/>
      <span className={styles.label}>2.5× zoom</span>
    </div>, document.body)}
  </>;
}
