# Testing Guide for Camp Javery Website Improvements

## Quick Testing Checklist

### 1. Accessibility Testing (5 minutes)

#### Keyboard Navigation
- [ ] Press `Tab` - should see clear focus outlines (orange, 3px)
- [ ] Navigate through entire page using only `Tab` and `Enter`
- [ ] Press `Tab` on page load - skip link should appear
- [ ] Press `Enter` on skip link - should jump to main content
- [ ] Open mobile menu with `Enter`, close with `Escape`
- [ ] Open photo modal, navigate with arrow keys, close with `Escape`

#### Screen Reader (Optional)
- [ ] Enable VoiceOver (Mac: Cmd+F5) or NVDA (Windows)
- [ ] Navigate through page - should hear clear labels
- [ ] Check image alt text is descriptive
- [ ] Verify landmarks are announced (banner, navigation, main, etc.)

### 2. Performance Testing (5 minutes)

#### Visual Check
- [ ] Scroll down page - images should lazy load
- [ ] Notice shimmer effect while images load
- [ ] Scroll animations should trigger when sections enter viewport
- [ ] Page should feel smooth and responsive

#### Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Run audit (Mobile)
4. Check scores:
   - Performance should be 85+
   - Accessibility should be 95+
   - Best Practices should be 90+
   - SEO should be 100

### 3. Mobile Testing (5 minutes)

#### Responsive Design
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
- [ ] Test on iPhone SE, iPhone 12 Pro, iPad
- [ ] Check hamburger menu works
- [ ] Verify touch targets are easy to tap
- [ ] Test photo gallery on mobile

#### Real Device (if available)
- [ ] Test on actual phone/tablet
- [ ] Check scroll performance
- [ ] Verify animations work smoothly
- [ ] Test photo gallery swipe/tap

### 4. Scroll Animations Testing (3 minutes)

- [ ] Refresh page and scroll slowly
- [ ] Each section should animate in when it appears
- [ ] Hero content should fade in on load
- [ ] Schedule items should fade from left
- [ ] FAQ items should fade up with stagger
- [ ] Photo gallery items should animate in sequence
- [ ] Contact cards should have staggered animation

### 5. Photo Gallery Testing (3 minutes)

- [ ] Click on any photo - modal should open
- [ ] Press left arrow - should go to previous photo
- [ ] Press right arrow - should go to next photo
- [ ] Press Escape - modal should close
- [ ] Click outside modal - should close
- [ ] Notice photo counter updates
- [ ] Images should load smoothly

### 6. Navigation Testing (3 minutes)

- [ ] Click each nav link - should smooth scroll
- [ ] Check active section is highlighted in nav
- [ ] Test mobile hamburger menu
- [ ] Verify menu closes after clicking link
- [ ] Click outside menu - should close
- [ ] Logo should scroll to top

### 7. SEO Testing (2 minutes)

#### Open Graph
1. Go to https://www.opengraph.xyz/
2. Enter your website URL
3. Verify preview looks good

#### Twitter Cards
1. Go to https://cards-dev.twitter.com/validator
2. Enter your website URL
3. Check preview

#### Structured Data
1. Go to https://search.google.com/test/rich-results
2. Enter your website URL
3. Verify event data is detected

### 8. Browser Compatibility (10 minutes)

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Check for:
- Animations work
- Images load
- Navigation works
- Styling is correct

### 9. Reduced Motion Testing (2 minutes)

#### Mac
1. System Preferences → Accessibility → Display
2. Enable "Reduce motion"
3. Refresh website
4. Animations should be minimal/instant

#### Windows
1. Settings → Ease of Access → Display
2. Enable "Show animations in Windows"
3. Refresh website
4. Animations should be minimal/instant

### 10. Guest Photo Upload Testing (10 minutes)

#### Upload Flow
- [ ] Open `/upload` on a mobile browser (Safari and Chrome)
- [ ] Submit with no name — should show a validation error before submitting
- [ ] Take a new photo via the camera option — should upload and show a success message
- [ ] Choose an existing photo from the photo library — should upload and show a success message
- [ ] Turn off wifi mid-upload, confirm an error appears after the automatic retry, then turn wifi back on and resubmit — should succeed

#### Gallery & Slideshow
- [ ] Open `/gallery` — confirm all uploaded photos appear with guest names
- [ ] Upload a new photo from another device/tab — confirm it appears in `/gallery` within ~20 seconds without a manual refresh
- [ ] Open `/slideshow` on a large screen — confirm it auto-advances every ~5 seconds and loops
- [ ] Confirm slideshow order is randomized (not the same order as the upload timestamps)

#### Admin Moderation
- [ ] Open `/admin`, enter an incorrect password — confirm an inline error, no access granted
- [ ] Enter the correct password — confirm the full photo list and count appear
- [ ] Delete a photo — confirm it disappears from `/admin`, `/gallery`, and `/slideshow`

### 11. Guest Video Upload Testing (10 minutes)

#### Upload Flow
- [ ] Open `/upload-video` — confirm the camp sign appears and the page
      only accepts video files
- [ ] Upload a video recorded on an iPhone (native `.mov`) — confirm it
      uploads successfully and plays back correctly in `/videos`
- [ ] Upload a video recorded on an Android phone (native `.mp4`) —
      confirm the same
- [ ] Watch the progress bar during a real upload — confirm the percentage
      counts up accurately and the gradient visibly shifts from gold
      toward red as it approaches 100%
- [ ] Try selecting a file over 250MB — confirm it's rejected immediately
      with a clear message, before any upload starts
- [ ] Confirm the success screen says "Your video is up" (not "photo")

#### Videos Gallery & Slideshow Isolation
- [ ] Open `/videos` — confirm uploaded videos appear with working native
      playback controls
- [ ] Upload a new video from another tab — confirm it appears in
      `/videos` within ~20 seconds without a manual refresh
- [ ] Open `/slideshow` — confirm no video ever appears there, only
      photos, and there are no console errors

#### Admin Moderation
- [ ] Log into `/admin` — confirm both "Photo Moderation" and "Video
      Moderation" sections appear with correct counts
- [ ] Delete a video from admin — confirm it disappears from `/videos`
      and the admin grid
- [ ] Confirm deleting a photo still works correctly (no regression from
      adding the video section)

---

## Common Issues & Solutions

### Issue: Animations not working
- **Check**: Browser console for errors
- **Fix**: Ensure JavaScript is enabled, no console errors

### Issue: Images not lazy loading
- **Check**: Network tab in DevTools
- **Fix**: Verify Intersection Observer is supported

### Issue: Focus outlines not visible
- **Check**: Using Tab key (not mouse clicks)
- **Fix**: Some browsers need focus-visible polyfill

### Issue: Mobile menu not working
- **Check**: Click/tap on hamburger icon
- **Fix**: Verify JavaScript is enabled

### Issue: Scroll animations too fast/slow
- **Fix**: Adjust delay values in ScrollReveal components

---

## Performance Benchmarks

### Expected Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Largest Contentful Paint**: < 2.5s

### How to Check
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select Mobile device
4. Run Performance audit
5. Review metrics

---

## Accessibility Checklist

- [x] Keyboard navigation works throughout
- [x] Focus indicators are visible
- [x] Skip link present and working
- [x] All images have descriptive alt text
- [x] ARIA labels on interactive elements
- [x] Semantic HTML structure
- [x] Color contrast meets WCAG AA
- [x] Forms have proper labels
- [x] Modals are keyboard accessible
- [x] Reduced motion respected

---

## Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run both frontend and backend
npm run dev:all
```

---

## Browser DevTools Shortcuts

### Chrome/Edge/Firefox
- Open DevTools: `F12` or `Ctrl+Shift+I` (Win) / `Cmd+Option+I` (Mac)
- Toggle Device Toolbar: `Ctrl+Shift+M` (Win) / `Cmd+Shift+M` (Mac)
- Open Console: `Ctrl+Shift+J` (Win) / `Cmd+Option+J` (Mac)
- Lighthouse: `F12` → Lighthouse tab

### Safari
- Open DevTools: `Cmd+Option+I`
- Enable Developer Menu: Preferences → Advanced → Show Develop menu

---

## Need Help?

### Resources
- [Web.dev Accessibility](https://web.dev/accessibility)
- [MDN Web Docs](https://developer.mozilla.org/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Can I Use](https://caniuse.com/) - Browser compatibility

### Testing Tools
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)

---

Happy Testing! 🎉
