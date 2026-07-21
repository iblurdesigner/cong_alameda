package services

import (
	"testing"
	"time"
)

func TestRateLimiter_Allow(t *testing.T) {
	rl := NewRateLimiter(50 * time.Millisecond)

	// First request should be allowed
	if !rl.Allow("test@example.com") {
		t.Error("expected first request to be allowed")
	}

	// Immediate second request should be denied (within cooldown)
	if rl.Allow("test@example.com") {
		t.Error("expected second request within cooldown to be denied")
	}

	// Different key should be allowed
	if !rl.Allow("other@example.com") {
		t.Error("expected different key to be allowed")
	}
}

func TestRateLimiter_AllowAfterCooldown(t *testing.T) {
	rl := NewRateLimiter(50 * time.Millisecond)

	// First request
	if !rl.Allow("test@example.com") {
		t.Error("expected first request to be allowed")
	}

	// Wait for cooldown to expire
	time.Sleep(60 * time.Millisecond)

	// Should be allowed again
	if !rl.Allow("test@example.com") {
		t.Error("expected request after cooldown to be allowed")
	}
}

func TestRateLimiter_StaleCleanup(t *testing.T) {
	rl := NewRateLimiter(10 * time.Millisecond)

	// Insert several entries
	rl.Allow("old1@example.com")
	rl.Allow("old2@example.com")

	// Wait for entries to become stale (>2x cooldown)
	time.Sleep(25 * time.Millisecond)

	// This call triggers cleanup
	rl.Allow("new@example.com")

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Old entries should have been cleaned up
	if _, exists := rl.requests["old1@example.com"]; exists {
		t.Error("expected stale entry old1 to be cleaned up")
	}
	if _, exists := rl.requests["old2@example.com"]; exists {
		t.Error("expected stale entry old2 to be cleaned up")
	}
}

func TestRateLimiter_DifferentKeysIndependent(t *testing.T) {
	rl := NewRateLimiter(100 * time.Millisecond)

	// First key gets rate limited
	rl.Allow("first@example.com")
	if !rl.Allow("second@example.com") {
		t.Error("expected second key to be allowed independently")
	}

	// First key still denied
	if rl.Allow("first@example.com") {
		t.Error("expected first key to still be in cooldown")
	}
}
