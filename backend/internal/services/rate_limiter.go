package services

import (
	"sync"
	"time"
)

// RateLimiter provides in-memory rate limiting with per-key cooldown
type RateLimiter struct {
	mu       sync.Mutex
	requests map[string]time.Time
	cooldown time.Duration
}

// NewRateLimiter creates a new RateLimiter with the specified cooldown duration
func NewRateLimiter(cooldown time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string]time.Time),
		cooldown: cooldown,
	}
}

// Allow returns true if the key is allowed (not within cooldown period)
// It also cleans stale entries on each call to prevent unbounded growth
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	// Clean stale entries (older than 2x cooldown)
	for k, t := range rl.requests {
		if now.Sub(t) > rl.cooldown*2 {
			delete(rl.requests, k)
		}
	}

	// Check if key is in cooldown
	if lastTime, exists := rl.requests[key]; exists {
		if now.Sub(lastTime) < rl.cooldown {
			return false
		}
	}

	// Record the request
	rl.requests[key] = now
	return true
}
