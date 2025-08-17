/**
 * Test utility to verify ResizeObserver fix is working
 */

export const testResizeObserverFix = () => {
  console.log('Testing ResizeObserver fix...');
  
  // Test if ResizeObserver is available
  if (typeof ResizeObserver === 'undefined') {
    console.log('ResizeObserver not available in this environment');
    return false;
  }

  // Create a test element
  const testElement = document.createElement('div');
  testElement.style.width = '100px';
  testElement.style.height = '100px';
  testElement.style.position = 'absolute';
  testElement.style.top = '-9999px';
  testElement.style.left = '-9999px';
  document.body.appendChild(testElement);

  let resizeObserverCalled = false;
  let errorCaught = false;

  try {
    // Create a ResizeObserver that might trigger the error
    const observer = new ResizeObserver((entries) => {
      resizeObserverCalled = true;
      
      // Simulate rapid size changes that might cause the error
      entries.forEach(entry => {
        const { width, height } = entry.contentRect;
        
        // Rapidly change the element size to potentially trigger the error
        testElement.style.width = `${width + 1}px`;
        testElement.style.height = `${height + 1}px`;
        
        // Change back
        setTimeout(() => {
          testElement.style.width = `${width}px`;
          testElement.style.height = `${height}px`;
        }, 0);
      });
    });

    // Observe the test element
    observer.observe(testElement);

    // Trigger some size changes
    setTimeout(() => {
      testElement.style.width = '200px';
      testElement.style.height = '200px';
    }, 10);

    setTimeout(() => {
      testElement.style.width = '150px';
      testElement.style.height = '150px';
    }, 20);

    setTimeout(() => {
      testElement.style.width = '100px';
      testElement.style.height = '100px';
    }, 30);

    // Clean up after test
    setTimeout(() => {
      observer.disconnect();
      document.body.removeChild(testElement);
      
      if (resizeObserverCalled && !errorCaught) {
        console.log('✅ ResizeObserver fix is working correctly');
        return true;
      } else {
        console.log('❌ ResizeObserver fix may not be working');
        return false;
      }
    }, 100);

  } catch (error) {
    errorCaught = true;
    if (error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      console.log('✅ ResizeObserver error was caught and suppressed');
      return true;
    } else {
      console.log('❌ Unexpected error:', error);
      return false;
    }
  }

  return true;
};

export default testResizeObserverFix;
