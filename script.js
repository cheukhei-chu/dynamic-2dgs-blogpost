document.addEventListener('DOMContentLoaded', () => {
    // --- Table of Contents Active Link Highlighting ---
    const tocLinks = document.querySelectorAll('#table-of-contents ul li a');
    const sections = [];
    tocLinks.forEach(link => {
        const sectionId = link.getAttribute('href')?.substring(1);
        if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section) sections.push(section);
        }
    });

    function updateActiveTocLink() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        const offset = window.innerHeight * 0.1;

        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (section.offsetTop <= scrollPosition + offset + 1) {
                currentSectionId = section.getAttribute('id');
                break;
            }
        }
        tocLinks.forEach(link => link.classList.remove('active'));
        if (currentSectionId) {
            const activeLink = document.querySelector(`#table-of-contents ul li a[href="#${currentSectionId}"]`);
            if (activeLink) activeLink.classList.add('active');
        }
    }
    window.addEventListener('scroll', updateActiveTocLink);
    setTimeout(updateActiveTocLink, 100); // Initial check

    // --- Video Comparison Slider Logic ---
    const comparisonContainers = document.querySelectorAll('.comparison-container');

    comparisonContainers.forEach(container => {
        const videoOver = container.querySelector('.comparison-video-over');
        const sliderElement = container.querySelector('.comparison-slider');
        const videoUnder = container.querySelector('.comparison-video-under'); // For syncing playback

        if (!videoOver || !sliderElement || !videoUnder) {
            console.warn("Comparison container missing required elements:", container);
            return;
        }
        
        // Sync playback and volume
        function syncVideos(master, slave) {
            if (master.paused !== slave.paused) {
                if (master.paused) slave.pause(); else slave.play();
            }
            if (Math.abs(master.currentTime - slave.currentTime) > 0.2) { // Sync if more than 0.2s diff
                slave.currentTime = master.currentTime;
            }
            slave.volume = master.volume;
            slave.muted = master.muted;
        }

        videoUnder.addEventListener('play', () => { if(videoOver.paused) videoOver.play(); });
        videoUnder.addEventListener('pause', () => { if(!videoOver.paused) videoOver.pause(); });
        videoUnder.addEventListener('volumechange', () => { videoOver.volume = videoUnder.volume; videoOver.muted = videoUnder.muted; });
        videoUnder.addEventListener('timeupdate', () => { // More robust syncing
            if (Math.abs(videoUnder.currentTime - videoOver.currentTime) > 0.5) { // Sync if more than 0.5s diff
                videoOver.currentTime = videoUnder.currentTime;
            }
        });
         videoOver.addEventListener('timeupdate', () => { // Sync other way too
            if (Math.abs(videoOver.currentTime - videoUnder.currentTime) > 0.5) {
                videoUnder.currentTime = videoOver.currentTime;
            }
        });


        let isDragging = false;

        function updateClip(xPosition) {
            const containerRect = container.getBoundingClientRect();
            let percentage = ((xPosition - containerRect.left) / containerRect.width) * 100;
            percentage = Math.max(0, Math.min(100, percentage)); // Clamp between 0 and 100

            videoOver.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
            sliderElement.style.left = `${percentage}%`;
        }

        sliderElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            sliderElement.classList.add('dragging'); // Optional: for styling
            // Play both videos if paused when interaction starts
            if(videoUnder.paused) videoUnder.play();
            if(videoOver.paused) videoOver.play();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                sliderElement.classList.remove('dragging');
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateClip(e.clientX);
            }
        });
        
        // Touch events for mobile
        sliderElement.addEventListener('touchstart', (e) => {
            isDragging = true;
            sliderElement.classList.add('dragging');
            if(videoUnder.paused) videoUnder.play();
            if(videoOver.paused) videoOver.play();
            // Prevent page scroll while dragging slider
            e.preventDefault(); 
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                sliderElement.classList.remove('dragging');
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                updateClip(e.touches[0].clientX);
            }
        });


        // Initial clip based on default slider value (if slider input type range was used)
        // updateClip(sliderElement.getBoundingClientRect().left + (sliderElement.value / 100) * container.offsetWidth);
        // For our div slider, initial clip is set by CSS.
    });

    // JuxtaposeJS init for image sliders (if you keep it)
    // This will find all divs with class 'juxtapose' and initialize them
    // No specific JS needed here if you just include their library and use the class.
    // If you have issues, you might need:
    // if (typeof juxtapose !== 'undefined') {
    //     juxtapose.scan(); 
    // }
});

// Global function for Juxtapose slider compatibility (if still using its HTML structure)
// This function would be called by an oninput event of a range slider if you were using
// Juxtapose's HTML structure for the slider itself. The new CSS slider is different.
function updateComparison(slider) {
    const container = slider.closest('.comparison-container');
    if (!container) return;
    const videoOver = container.querySelector('.comparison-video-over');
    const sliderHandle = container.querySelector('.comparison-slider'); // The draggable div
    
    const percentage = slider.value; // Assuming slider is an <input type="range">
    videoOver.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    
    // If you are also moving a custom div slider handle based on an input range:
    if (sliderHandle) {
      sliderHandle.style.left = `${percentage}%`;
    }
}