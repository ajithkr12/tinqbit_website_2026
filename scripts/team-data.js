(function () {
  var LI_SVG =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>';

  window.TINQBIT_TEAM = {
    leads: [
      {
        initials: "NI",
        gradient: "linear-gradient(135deg,#1e3a5a,#1490c8)",
        image: "/assets/teams/nikhil.webp",
        name: "Nikhil",
        role: "CEO & Co-Founder",
        linkedin: "https://www.linkedin.com/in/nikhil-ajay/",
      },
      {
        initials: "SR",
        gradient: "linear-gradient(135deg,#059669,#0d9488)",
        image: "/assets/teams/sreejith.webp",
        name: "Sreejith",
        role: "CTO & Co-Founder",
        linkedin: "https://www.linkedin.com/in/sreetheprogrammer/",
      },
      {
        initials: "AJ",
        gradient: "linear-gradient(135deg,#7c3aed,#c026d3)",
        image: "/assets/teams/ajith.webp",
        name: "Ajith",
        role: "COO & Co-Founder",
        linkedin: "https://www.linkedin.com/in/ajith-kr/",
      },
    ],
    members: [
      {
        initials: "VI",
        gradient: "linear-gradient(135deg,#ea580c,#d97706)",
        image: "/assets/teams/vimal.webp",
        name: "Vimal",
        role: "Sales Executive",
        linkedin: "https://linkedin.com/in/",
      },
      {
        initials: "AL",
        gradient: "linear-gradient(135deg,#0891b2,#45bfe5)",
        image: "/assets/teams/alfiya.webp",
        name: "Alfiya",
        role: "Digital Marketing Executive",
        linkedin: "https://linkedin.com/in/",
      },
    ],
  };

  function buildCard(member) {
    var photoInner = member.image
      ? '<img src="' +
        member.image +
        '" alt="' +
        member.name +
        '" loading="lazy">'
      : '<div class="tm-placeholder"><div class="pl-init">' +
        member.initials +
        "</div></div>";

    return (
      '<div class="tm-card">' +
      '<div class="tm-photo" style="background:' +
      member.gradient +
      ';">' +
      photoInner +
      "</div>" +
      '<div class="tm-body">' +
      '<div class="tm-name">' +
      member.name +
      "</div>" +
      '<div class="tm-role">' +
      member.role +
      "</div>" +
      "</div>" +
      '<div class="tm-footer">' +
      '<a href="' +
      member.linkedin +
      '" target="_blank" rel="noopener" class="tm-li">' +
      LI_SVG +
      " LinkedIn" +
      "</a>" +
      "</div>" +
      "</div>"
    );
  }

  function injectJsonLd(all) {
    var schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Tinqbit Team Members",
      itemListElement: all.map(function (m, i) {
        return {
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Person",
            name: m.name,
            jobTitle: m.role,
            image: m.image ? "https://tinqbit.com" + m.image : undefined,
            worksFor: {
              "@type": "Organization",
              name: "Tinqbit",
              url: "https://tinqbit.com",
            },
          },
        };
      }),
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify(schema);
    document.head.appendChild(s);
  }

  function render() {
    var leadsEl = document.getElementById("team-leads-grid");
    var membersEl = document.getElementById("team-members-grid");
    if (leadsEl) {
      leadsEl.innerHTML = window.TINQBIT_TEAM.leads.map(buildCard).join("");
    }
    if (membersEl) {
      membersEl.innerHTML = window.TINQBIT_TEAM.members.map(buildCard).join("");
    }
    injectJsonLd(window.TINQBIT_TEAM.leads.concat(window.TINQBIT_TEAM.members));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
