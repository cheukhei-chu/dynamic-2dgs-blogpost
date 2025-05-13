document.addEventListener('DOMContentLoaded', () => {
    // ... your existing interactive video slider code ...


    // --- Table of Contents Active Link Highlighting ---
    const tocLinks = document.querySelectorAll('#table-of-contents ul li a');
    const sections = []; // We will populate this based on tocLinks hrefs

    tocLinks.forEach(link => {
        const sectionId = link.getAttribute('href').substring(1); // Get ID from href (e.g., "#introduction" -> "introduction")
        const section = document.getElementById(sectionId);
        if (section) {
            sections.push(section);
        }
    });

    // Function to remove active class from all TOC links
    function removeActiveClasses() {
        tocLinks.forEach(link => {
            link.classList.remove('active');
        });
    }

    // Function to add active class to the current link
    function addActiveClass(id) {
        const activeLink = document.querySelector(`#table-of-contents ul li a[href="#${id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Scroll event listener
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;

        // Determine which section is currently in view
        // Iterate backwards to correctly catch sections when scrolled from bottom up
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            // Adjust offsetTop if you have a fixed header.
            // The "200" is a buffer, adjust as needed.
            // It means the section is considered "active" when its top is within 200px from the top of the viewport.
            if (section.offsetTop <= scrollPosition + 200) {
                currentSectionId = section.getAttribute('id');
                break;
            }
        }

        // If no section is "active" (e.g., at the very top before any section),
        // you might want to highlight the first one or none.
        if (!currentSectionId && sections.length > 0 && scrollPosition < sections[0].offsetTop) {
             // Optionally, highlight the first link if scrolled to the very top
            // currentSectionId = sections[0].getAttribute('id');
        }


        removeActiveClasses();
        if (currentSectionId) {
            addActiveClass(currentSectionId);
        }
    });

    // Initial check in case the page loads scrolled to a section
    // Trigger a scroll event manually or call the highlighting logic directly
    // For simplicity, a small timeout allows elements to fully render before check
    setTimeout(() => {
        window.dispatchEvent(new Event('scroll'));
    }, 100);

});
