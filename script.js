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

    // --- Canvas Bear Comparison Slider Logic (New) ---
    const box = document.querySelector('#bear-compare');
    if (box) {
        const canvas = box.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        const videoUnder = box.querySelector('#bearUnder'); // Original Bear
        const videoOver = box.querySelector('#bearOver');   // Recolored Bear
        const handle = box.querySelector('.comparison-slider');

        if (canvas && ctx && videoUnder && videoOver && handle) {
            Promise.all([
                new Promise(r => videoUnder.onloadedmetadata = r),
                new Promise(r => videoOver.onloadedmetadata = r)
            ]).then(() => {
                const { videoWidth: w, videoHeight: h } = videoUnder; // Use one video for dimensions
                canvas.width = w;
                canvas.height = h;
                videoUnder.play();
                videoOver.play();
                draw();
            }).catch(error => {
                console.error("Error loading video metadata for canvas comparison:", error);
            });

            // Sync playback time
            videoUnder.addEventListener('timeupdate', () => {
                if (Math.abs(videoUnder.currentTime - videoOver.currentTime) > 0.05) { // Tighter threshold
                    videoOver.currentTime = videoUnder.currentTime;
                }
            });
            videoOver.addEventListener('timeupdate', () => {
                if (Math.abs(videoOver.currentTime - videoUnder.currentTime) > 0.05) { // Tighter threshold
                    videoUnder.currentTime = videoOver.currentTime;
                }
            });
            // Ensure they also sync on play/pause if user interacts with video controls (though hidden)
            const syncPlayState = (master, slave) => {
                if (master.paused && !slave.paused) slave.pause();
                if (!master.paused && slave.paused) slave.play();
            };
            videoUnder.addEventListener('play', () => syncPlayState(videoUnder, videoOver));
            videoUnder.addEventListener('pause', () => syncPlayState(videoUnder, videoOver));
            videoOver.addEventListener('play', () => syncPlayState(videoOver, videoUnder));
            videoOver.addEventListener('pause', () => syncPlayState(videoOver, videoUnder));

            let split = 0.5; // 0 (left) to 1 (right) position of the slider
            const boxRect = () => box.getBoundingClientRect();

            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas each frame

                const splitPixel = canvas.width * split;

                // Draw the left part: original video (videoUnder)
                if (videoUnder.readyState >= 2) { // HAVE_CURRENT_DATA
                    const sWidth = videoUnder.videoWidth * split; // Source width from original video
                    if (isFinite(splitPixel) && splitPixel > 0 && isFinite(canvas.height) && canvas.height > 0) {
                        ctx.drawImage(videoUnder, 
                                      0, 0, sWidth, videoUnder.videoHeight, // Source rect (left part of original video)
                                      0, 0, splitPixel, canvas.height);    // Destination rect (left part of canvas)
                    }
                }

                // Draw the right part: recolored video (videoOver)
                if (videoOver.readyState >= 2) { // HAVE_CURRENT_DATA
                    const sX = videoOver.videoWidth * split; // Source X from recolored video
                    const sWidth = videoOver.videoWidth * (1 - split); // Source width from recolored video
                    const dWidth = canvas.width * (1 - split); // Destination width on canvas

                    if (isFinite(dWidth) && dWidth > 0 && isFinite(canvas.height) && canvas.height > 0) {
                        ctx.drawImage(videoOver, 
                                      sX, 0, sWidth, videoOver.videoHeight,         // Source rect (right part of recolored video)
                                      splitPixel, 0, dWidth, canvas.height); // Destination rect (right part of canvas)
                    }
                }
                requestAnimationFrame(draw);
            }

            const startDrag = e => {
                e.preventDefault();
                const move = e.type === 'mousedown' ? 'mousemove' : 'touchmove';
                const stop = e.type === 'mousedown' ? 'mouseup' : 'touchend';
                const onMove = ev => {
                    const x = (move === 'mousemove' ? ev.clientX : ev.touches[0].clientX) -
                        boxRect().left;
                    split = Math.max(0, Math.min(1, x / boxRect().width));
                    handle.style.left = (split * 100) + '%';
                };
                document.addEventListener(move, onMove, { passive: false });
                document.addEventListener(stop, () => {
                    document.removeEventListener(move, onMove);
                }, { once: true });
            };
            handle.addEventListener('mousedown', startDrag);
            handle.addEventListener('touchstart', startDrag, { passive: false });
        } else {
            console.warn("#bear-compare canvas comparison is missing one or more required child elements (canvas, #bearUnder, #bearOver, .comparison-slider).");
        }
    } else {
        // console.log("#bear-compare element not found, canvas slider not initialized."); // Optional: log if element not found
    }

    // --- Side-by-Side Video Sync Logic ---
    const sideBySidePairs = document.querySelectorAll('.side-by-side-video-pair');
    sideBySidePairs.forEach(pairContainer => {
        const videoItems = pairContainer.querySelectorAll('.video-item video');

        if (videoItems.length >= 2) {
            const videoLeft = videoItems[0];
            const videoRight = videoItems[1];

            videoLeft.play().catch(error => console.error("Error attempting to autoplay videoLeft:", error, videoLeft.src));
            videoRight.play().catch(error => console.error("Error attempting to autoplay videoRight:", error, videoRight.src));

            videoLeft.addEventListener('timeupdate', () => {
                if (Math.abs(videoLeft.currentTime - videoRight.currentTime) > 0.2) {
                    videoRight.currentTime = videoLeft.currentTime;
                }
            });

            videoRight.addEventListener('timeupdate', () => {
                if (Math.abs(videoRight.currentTime - videoLeft.currentTime) > 0.2) {
                    videoLeft.currentTime = videoRight.currentTime;
                }
            });
        } else {
            console.warn("Side-by-side video pair container missing required video elements (expected at least 2 videos within .video-item):", pairContainer);
        }
    });

    // JuxtaposeJS init for image sliders (if you keep it)
    // This will find all divs with class 'juxtapose' and initialize them
    // No specific JS needed here if you just include their library and use the class.
    // If you have issues, you might need:
    // if (typeof juxtapose !== 'undefined') {
    //     juxtapose.scan(); 
    // }
});

// The global updateComparison function can be removed as it's no longer used by the new canvas slider or other functionalities.