// Named animation definitions are included only when their Tailwind
// animate-[...] utility is used by a component.
const config = {
  theme: {
    extend: {
      keyframes: {
        "productSlideFade": {
          "from": {
            "opacity": ".35",
            "transform": "scale(.985)"
          },
          "to": {
            "opacity": "1",
            "transform": "scale(1)"
          }
        },
        "spinner-rotate": {
          "0%": {
            "transform": "rotate(0deg)"
          },
          "100%": {
            "transform": "rotate(360deg)"
          }
        },
        "overlay-fadein": {
          "from": {
            "opacity": "0"
          },
          "to": {
            "opacity": "1"
          }
        },
        "text-pulse": {
          "0%,\n  100%": {
            "opacity": "1"
          },
          "50%": {
            "opacity": "0.5"
          }
        },
        "announcement-scroll": {
          "from": {
            "transform": "translateX(0)"
          },
          "to": {
            "transform": "translateX(-50%)"
          }
        },
        "rdeDropPulse": {
          "0%,\n  100%": {
            "opacity": "1"
          },
          "50%": {
            "opacity": "0.6"
          }
        },
        "rdeBlockIn": {
          "from": {
            "opacity": "0",
            "transform": "translateY(-8px)"
          },
          "to": {
            "opacity": "1",
            "transform": "translateY(0)"
          }
        },
        "rdeSpin": {
          "to": {
            "transform": "rotate(360deg)"
          }
        },
        "whatsapp-pulse": {
          "0%,\n  100%": {
            "box-shadow": "0 8px 24px #0c5c3370, 0 0 0 0 rgba(22, 191, 99, .28)"
          },
          "50%": {
            "box-shadow": "0 10px 28px #0c5c3380, 0 0 0 11px rgba(22, 191, 99, 0)"
          }
        },
        "admin-spin": {
          "to": {
            "transform": "rotate(360deg)"
          }
        },
        "spin": {
          "to": {
            "transform": "rotate(360deg)"
          }
        },
        "megaItemReveal": {
          "from": {
            "opacity": "0",
            "transform": "translateY(16px) scale(0.96)"
          },
          "to": {
            "opacity": "1",
            "transform": "translateY(0) scale(1)"
          }
        },
        "gallery-img-switch": {
          "0%": {
            "opacity": "0",
            "transform": "scale(.96)"
          },
          "100%": {
            "opacity": "1",
            "transform": "scale(1)"
          }
        },
        "gallery-slide-in-left": {
          "0%": {
            "opacity": "0",
            "transform": "translateX(50px)"
          },
          "100%": {
            "opacity": "1",
            "transform": "translateX(0)"
          }
        },
        "gallery-slide-in-right": {
          "0%": {
            "opacity": "0",
            "transform": "translateX(-50px)"
          },
          "100%": {
            "opacity": "1",
            "transform": "translateX(0)"
          }
        },
        "wa-pop": {
          "from": {
            "opacity": "0",
            "transform": "scale(.9) translateY(8px)"
          },
          "to": {
            "opacity": "1",
            "transform": "scale(1) translateY(0)"
          }
        },
        "whatsapp-premium": {
          "50%": {
            "box-shadow": "0 0 0 12px rgba(37, 211, 102, .18), 0 15px 35px rgba(0, 0, 0, .2)"
          }
        },
        "pds-faq-in": {
          "from": {
            "opacity": "0",
            "transform": "translateY(8px)"
          },
          "to": {
            "opacity": "1",
            "transform": "translateY(0)"
          }
        },
        "pds-rev-in": {
          "from": {
            "opacity": "0",
            "transform": "translateY(12px)"
          },
          "to": {
            "opacity": "1",
            "transform": "translateY(0)"
          }
        },
        "fadeIn": {
          "from": {
            "opacity": "0"
          },
          "to": {
            "opacity": "1"
          }
        },
        "slideUp": {
          "from": {
            "opacity": "0",
            "transform": "translateY(10px)"
          },
          "to": {
            "opacity": "1",
            "transform": "translateY(0)"
          }
        },
        "inquiryFadeIn": {
          "from": {
            "opacity": "0"
          },
          "to": {
            "opacity": "1"
          }
        },
        "inquirySlideUp": {
          "from": {
            "transform": "translateY(32px) scale(0.97)",
            "opacity": "0"
          },
          "to": {
            "transform": "translateY(0) scale(1)",
            "opacity": "1"
          }
        },
        "acc-spin": {
          "to": {
            "transform": "rotate(360deg)"
          }
        },
        "slideInFromRight": {
          "from": {
            "transform": "translateX(6%)",
            "opacity": "0"
          },
          "to": {
            "transform": "translateX(0)",
            "opacity": "1"
          }
        },
        "slideInFromLeft": {
          "from": {
            "transform": "translateX(-6%)",
            "opacity": "0"
          },
          "to": {
            "transform": "translateX(0)",
            "opacity": "1"
          }
        }
      },
    },
  },
};
export default config;
