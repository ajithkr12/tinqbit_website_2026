/*
 * Tinqbit floating widget: WhatsApp button + site-content chatbot.
 *
 * Self-contained — injects its own styles and markup, so every page only
 * needs to load this one script (added near the closing </body> tag).
 *
 * To change the WhatsApp number or default message, edit WHATSAPP_NUMBER /
 * WHATSAPP_MESSAGE below.
 */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "918848279751";
  var WHATSAPP_MESSAGE = "Hi Tinqbit! I'd like to know more about your services.";

  /* ── Knowledge base ──
   * Checked top-to-bottom; the first entry whose keyword is found inside
   * the user's message wins. Keep more specific entries above generic ones. */
  var KB = [
    {
      keywords: ["hi", "hello", "hey", "hii", "helo", "good morning", "good afternoon", "good evening", "yo "],
      reply: "Hi there! 👋 I'm the Tinqbit Assistant. Ask me about our services, pricing, portfolio, or how to get in touch — or pick an option below."
    },
    {
      keywords: ["mobile app", "android", "ios app", "app development", "mobile development"],
      reply: "We design &amp; build native and cross-platform mobile apps for iOS and Android. <a href=\"/services/mobile-app-development.html\">Mobile App Development →</a>"
    },
    {
      keywords: ["website", "web develop", "web design", "ecommerce", "e-commerce", "online store", "landing page"],
      reply: "We build everything from marketing websites to complex web apps and e-commerce stores using modern, fast, SEO-friendly tech. <a href=\"/web-development.html\">Web Development →</a>"
    },
    {
      keywords: ["digital marketing", "seo", "social media", "marketing", "advertising", "ppc", "google ads", "meta ads", "branding"],
      reply: "Our digital marketing services cover SEO, social media, paid ads (Google &amp; Meta), content and email marketing — built to grow your traffic and leads. <a href=\"/digital-marketing.html\">Digital Marketing →</a>"
    },
    {
      keywords: ["software", "crm", "erp", "cloud", "it consult", "custom software", "automation", "artificial intelligence", " ai "],
      reply: "We also build custom software, CRM &amp; ERP systems, cloud solutions and IT consulting / automation tailored to your business. <a href=\"/it-solution.html\">IT Solutions →</a>"
    },
    {
      keywords: ["service", "what do you do", "what can you do", "offer"],
      reply: "We offer Web &amp; Mobile Development, Digital Marketing, Software/CRM/ERP, Cloud &amp; IT Consulting, UI/UX Design and more. <a href=\"/services.html\">View All Services →</a>"
    },
    {
      keywords: ["price", "pricing", "cost", "quote", "quotation", "budget", "how much", "charge", "rate"],
      reply: "Pricing depends on your project's scope — every business is different! Share a few details with our team and we'll get back with a tailored quote. <a href=\"/contact.html\">Get a Free Quote →</a>"
    },
    {
      keywords: ["portfolio", "our work", "case stud", "projects", "previous work", "examples"],
      reply: "We've delivered 50+ projects across industries, from startups to enterprises. <a href=\"/works.html\">See Our Work →</a>"
    },
    {
      keywords: ["about", "who are you", "tinqbit", "company", "your story", "founded", "based in"],
      reply: "Tinqbit is a Kerala-based digital marketing &amp; IT solutions company, founded in Kochi in 2019. We're 5+ years strong, with a 15+ member team, 40+ happy clients and 50+ projects delivered. <a href=\"/about-us.html\">About Us →</a>"
    },
    {
      keywords: ["team", "who works", "employees", "staff", "founder", "ceo"],
      reply: "Our team of 15+ designers, developers, marketers and strategists is based in Kochi, Kerala. <a href=\"/team.html\">Meet the Team →</a>"
    },
    {
      keywords: ["testimonial", "review", "feedback", "clients say", "rating"],
      reply: "We're proud of our 4.9/5 average client rating! <a href=\"/testimonials.html\">Read Client Testimonials →</a>"
    },
    {
      keywords: ["career", "job", "hiring", "vacancy", "opening", "work with you", "work for you"],
      reply: "We're always on the lookout for great talent! <a href=\"/careers.html\">View Open Positions →</a>"
    },
    {
      keywords: ["blog", "article", "resources", "guide"],
      reply: "Check out our blog for tips and insights on web, marketing &amp; tech. <a href=\"/blog/\">Visit Our Blog →</a>"
    },
    {
      keywords: ["human", "agent", "real person", "talk to someone", "representative"],
      reply: "Sure! Tap the green WhatsApp button to chat directly with our team, or <a href=\"/contact.html\">fill out our contact form →</a>"
    },
    {
      keywords: ["contact", "phone", "email", "number", "address", "reach you", "location", "where are you", "call you"],
      reply: "You can reach us at:<br>📞 <a href=\"tel:+918848279751\">+91 88482 79751</a><br>✉️ <a href=\"mailto:info@tinqbit.com\">info@tinqbit.com</a><br>📍 Kochi, Kerala, India<br>Or tap the WhatsApp button for an instant chat. <a href=\"/contact.html\">Contact Page →</a>"
    },
    {
      keywords: ["thank", "thanks", "thx", "appreciate"],
      reply: "You're very welcome! 😊 Anything else I can help with?"
    },
    {
      keywords: ["bye", "goodbye", "see you", "later"],
      reply: "Thanks for stopping by — have a great day! 👋"
    }
  ];

  var FALLBACK_REPLY = "Hmm, I didn't quite catch that 🤔. Try asking about our services, pricing, portfolio, team, or contact info — or tap the WhatsApp button to chat with our team directly.";

  var QUICK_REPLIES = ["Our Services", "Get a Quote", "Our Work", "Contact Us"];

  function getResponse(text) {
    var msg = " " + text.toLowerCase() + " ";
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var kws = KB[i].keywords;
      var score = 0;
      for (var j = 0; j < kws.length; j++) {
        if (msg.indexOf(kws[j]) !== -1) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = KB[i];
      }
    }
    return best ? best.reply : FALLBACK_REPLY;
  }

  function injectStyles() {
    var css = "" +
      ".tq-fabs{position:fixed;right:22px;bottom:22px;display:flex;flex-direction:column;align-items:flex-end;gap:14px;z-index:9999;font-family:'Sora',sans-serif;}" +
      ".tq-fab{display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(13,27,42,.25);transition:transform .15s ease,box-shadow .15s ease;color:#fff;}" +
      ".tq-fab:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 12px 28px rgba(13,27,42,.3);}" +
      ".tq-fab-whatsapp{background:#25D366;}" +
      ".tq-fab-chat{background:linear-gradient(135deg,#1e3a5a,#1490c8);position:relative;}" +
      ".tq-fab-icon-chat,.tq-fab-icon-close{display:flex;}" +
      ".tq-fab-chat .tq-fab-icon-close{display:none;}" +
      ".tq-fab-chat.open .tq-fab-icon-chat{display:none;}" +
      ".tq-fab-chat.open .tq-fab-icon-close{display:flex;}" +
      ".tq-fab-dot{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#f5a31a;border:2px solid #fff;}" +
      ".tq-bubble{position:fixed;right:90px;bottom:36px;max-width:220px;background:#fff;color:#0f1f2e;padding:12px 14px;border-radius:14px;box-shadow:0 8px 24px rgba(13,27,42,.18);font-size:.85rem;line-height:1.4;z-index:9998;animation:tqFadeIn .3s ease;}" +
      ".tq-bubble::after{content:'';position:absolute;right:-6px;bottom:18px;width:12px;height:12px;background:#fff;transform:rotate(45deg);box-shadow:2px -2px 4px rgba(13,27,42,.05);}" +
      ".tq-bubble-close{position:absolute;top:4px;right:6px;border:none;background:none;cursor:pointer;color:#9aa9b6;font-size:1rem;line-height:1;padding:2px;}" +
      "@keyframes tqFadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}" +
      ".tq-chat-window{position:fixed;right:22px;bottom:92px;width:360px;max-width:calc(100vw - 32px);height:min(520px,70vh);background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(13,27,42,.25);display:flex;flex-direction:column;overflow:hidden;z-index:9999;opacity:0;visibility:hidden;transform:translateY(16px) scale(.98);transition:opacity .2s ease,transform .2s ease,visibility .2s;font-family:'Sora',sans-serif;}" +
      ".tq-chat-window.open{opacity:1;visibility:visible;transform:translateY(0) scale(1);}" +
      ".tq-chat-header{background:linear-gradient(135deg,#1e3a5a,#1490c8);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;}" +
      ".tq-chat-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:800;font-family:'Manrope',sans-serif;}" +
      ".tq-chat-title{flex:1;}" +
      ".tq-chat-title strong{display:block;font-family:'Manrope',sans-serif;font-size:.95rem;font-weight:700;}" +
      ".tq-chat-title span{display:block;font-size:.75rem;opacity:.85;}" +
      ".tq-chat-status{display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;margin-right:5px;}" +
      ".tq-chat-close{border:none;background:rgba(255,255,255,.15);color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}" +
      ".tq-chat-close:hover{background:rgba(255,255,255,.28);}" +
      ".tq-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f4f8fb;}" +
      ".tq-msg{max-width:82%;padding:9px 13px;border-radius:14px;font-size:.85rem;line-height:1.45;word-wrap:break-word;}" +
      ".tq-msg a{color:#1490c8;font-weight:600;text-decoration:none;}" +
      ".tq-msg a:hover{text-decoration:underline;}" +
      ".tq-msg-bot{align-self:flex-start;background:#fff;color:#0f1f2e;border-bottom-left-radius:4px;box-shadow:0 2px 6px rgba(13,27,42,.06);}" +
      ".tq-msg-user{align-self:flex-end;background:#1e3a5a;color:#fff;border-bottom-right-radius:4px;}" +
      ".tq-typing{align-self:flex-start;display:flex;gap:4px;padding:11px 14px;background:#fff;border-radius:14px;border-bottom-left-radius:4px;box-shadow:0 2px 6px rgba(13,27,42,.06);}" +
      ".tq-typing span{width:6px;height:6px;border-radius:50%;background:#aebcc7;animation:tqBlink 1.2s infinite ease-in-out;}" +
      ".tq-typing span:nth-child(2){animation-delay:.2s;}" +
      ".tq-typing span:nth-child(3){animation-delay:.4s;}" +
      "@keyframes tqBlink{0%,80%,100%{opacity:.3;}40%{opacity:1;}}" +
      ".tq-quick-replies{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 12px;background:#f4f8fb;flex-shrink:0;}" +
      ".tq-chip{border:1.5px solid #1490c8;color:#1490c8;background:#fff;border-radius:999px;padding:7px 14px;font-size:.78rem;font-weight:600;cursor:pointer;transition:background .15s,color .15s;font-family:'Sora',sans-serif;}" +
      ".tq-chip:hover{background:#1490c8;color:#fff;}" +
      ".tq-chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e7eef3;flex-shrink:0;background:#fff;}" +
      ".tq-chat-input{flex:1;border:1.5px solid #dde7ee;border-radius:999px;padding:10px 16px;font-size:.85rem;font-family:'Sora',sans-serif;outline:none;color:#0f1f2e;}" +
      ".tq-chat-input:focus{border-color:#1490c8;}" +
      ".tq-chat-send{width:40px;height:40px;border-radius:50%;border:none;background:#1e3a5a;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}" +
      ".tq-chat-send:hover{background:#1490c8;}" +
      "@media (max-width:480px){.tq-chat-window{right:16px;bottom:88px;width:calc(100vw - 32px);}.tq-fabs{right:16px;bottom:16px;}.tq-bubble{right:16px;bottom:140px;}}";

    var style = document.createElement("style");
    style.setAttribute("data-tq-widget", "");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function svg(paths, extra) {
    return '<svg width="' + (extra && extra.size || 22) + '" height="' + (extra && extra.size || 22) +
      '" viewBox="0 0 24 24" fill="' + (extra && extra.fill || "none") +
      '" stroke="' + (extra && extra.stroke || "currentColor") +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  var ICON_CHAT = svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>');
  var ICON_CLOSE = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
  var ICON_SEND = svg('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', { size: 18 });
  var ICON_WHATSAPP = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.45 5.15L2 22l5.07-1.55a9.87 9.87 0 0 0 4.97 1.34h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01c-1.55 0-3.07-.42-4.39-1.2l-.31-.19-3.27 1 1.01-3.19-.2-.33a8.07 8.07 0 0 1-1.25-4.32c0-4.48 3.64-8.12 8.13-8.12 2.17 0 4.21.85 5.74 2.39a8.06 8.06 0 0 1 2.38 5.74c0 4.48-3.65 8.22-8.13 8.22Zm4.45-6.07c-.24-.12-1.43-.7-1.65-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.78.95-.14.16-.29.18-.53.06-1.45-.72-2.4-1.29-3.36-2.92-.25-.43.25-.4.72-1.33.08-.16.04-.3-.04-.43-.08-.12-.5-1.2-.69-1.65-.18-.43-.37-.37-.51-.38-.13-.01-.29-.01-.44-.01-.16 0-.41.06-.62.3-.22.24-.83.81-.83 1.97 0 1.16.85 2.28.97 2.44.12.16 1.62 2.48 3.97 3.39 1.97.76 2.37.61 2.8.57.43-.04 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28Z"/></svg>';

  function buildWidget() {
    var wrap = document.createElement("div");
    wrap.className = "tq-fabs";

    var wa = document.createElement("a");
    wa.className = "tq-fab tq-fab-whatsapp";
    wa.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.setAttribute("aria-label", "Chat with us on WhatsApp");
    wa.innerHTML = ICON_WHATSAPP;

    var chatBtn = document.createElement("button");
    chatBtn.type = "button";
    chatBtn.className = "tq-fab tq-fab-chat";
    chatBtn.setAttribute("aria-label", "Open chat assistant");
    chatBtn.setAttribute("aria-expanded", "false");
    chatBtn.innerHTML =
      '<span class="tq-fab-icon-chat">' + ICON_CHAT + '</span>' +
      '<span class="tq-fab-icon-close">' + ICON_CLOSE + '</span>' +
      '<span class="tq-fab-dot"></span>';

    wrap.appendChild(wa);
    wrap.appendChild(chatBtn);

    /* Greeting bubble */
    var bubble = document.createElement("div");
    bubble.className = "tq-bubble";
    bubble.innerHTML = '<button type="button" class="tq-bubble-close" aria-label="Dismiss">&times;</button>' +
      "👋 Need help? Chat with our team or ask our assistant!";

    /* Chat window */
    var win = document.createElement("div");
    win.className = "tq-chat-window";
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", "Tinqbit chat assistant");
    win.innerHTML =
      '<div class="tq-chat-header">' +
        '<div class="tq-chat-avatar">TQ</div>' +
        '<div class="tq-chat-title"><strong>Tinqbit Assistant</strong><span><span class="tq-chat-status"></span>Typically replies instantly</span></div>' +
        '<button type="button" class="tq-chat-close" aria-label="Close chat">' + ICON_CLOSE + '</button>' +
      '</div>' +
      '<div class="tq-chat-body"></div>' +
      '<div class="tq-quick-replies"></div>' +
      '<form class="tq-chat-form">' +
        '<input type="text" class="tq-chat-input" placeholder="Type your message…" autocomplete="off" aria-label="Type your message" />' +
        '<button type="submit" class="tq-chat-send" aria-label="Send message">' + ICON_SEND + '</button>' +
      '</form>';

    document.body.appendChild(wrap);
    document.body.appendChild(bubble);
    document.body.appendChild(win);

    return { wrap: wrap, chatBtn: chatBtn, bubble: bubble, win: win };
  }

  function addMessage(body, html, who) {
    var msg = document.createElement("div");
    msg.className = "tq-msg tq-msg-" + who;
    if (who === "user") {
      msg.textContent = html;
    } else {
      msg.innerHTML = html;
    }
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
    return msg;
  }

  function addQuickReplies(container, body, onPick) {
    container.innerHTML = "";
    QUICK_REPLIES.forEach(function (label) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tq-chip";
      chip.textContent = label;
      chip.addEventListener("click", function () {
        onPick(label);
      });
      container.appendChild(chip);
    });
  }

  function respond(body, text) {
    var typing = document.createElement("div");
    typing.className = "tq-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    setTimeout(function () {
      typing.remove();
      addMessage(body, getResponse(text), "bot");
    }, 500 + Math.random() * 400);
  }

  function init() {
    injectStyles();
    var ui = buildWidget();
    var body = ui.win.querySelector(".tq-chat-body");
    var quickReplies = ui.win.querySelector(".tq-quick-replies");
    var form = ui.win.querySelector(".tq-chat-form");
    var input = ui.win.querySelector(".tq-chat-input");
    var started = false;

    function send(text) {
      text = text.trim();
      if (!text) return;
      addMessage(body, text, "user");
      input.value = "";
      respond(body, text);
    }

    function openChat() {
      ui.win.classList.add("open");
      ui.chatBtn.classList.add("open");
      ui.chatBtn.setAttribute("aria-expanded", "true");
      ui.bubble.style.display = "none";
      ui.chatBtn.querySelector(".tq-fab-dot").style.display = "none";
      if (!started) {
        started = true;
        addMessage(body, getResponse("hi"), "bot");
        addQuickReplies(quickReplies, body, send);
      }
      input.focus();
    }

    function closeChat() {
      ui.win.classList.remove("open");
      ui.chatBtn.classList.remove("open");
      ui.chatBtn.setAttribute("aria-expanded", "false");
    }

    ui.chatBtn.addEventListener("click", function () {
      if (ui.win.classList.contains("open")) closeChat();
      else openChat();
    });

    ui.win.querySelector(".tq-chat-close").addEventListener("click", closeChat);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      send(input.value);
    });

    ui.bubble.querySelector(".tq-bubble-close").addEventListener("click", function () {
      ui.bubble.style.display = "none";
    });

    /* Show greeting bubble after a short delay, hide it again later */
    setTimeout(function () {
      if (!ui.win.classList.contains("open")) ui.bubble.style.display = "block";
    }, 2500);
    setTimeout(function () {
      ui.bubble.style.display = "none";
    }, 12000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
