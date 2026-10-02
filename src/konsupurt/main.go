package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"konsupurt/internal/app"
	"konsupurt/internal/cmd"
	revisiongit "konsupurt/internal/cognitivespace/revision/git"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	service := app.NewService(revisiongit.NewFactory())
	code := cmd.ExecuteContext(ctx, service, os.Args[1:], cmd.Streams{
		In: os.Stdin, Out: os.Stdout, ErrOut: os.Stderr,
	})
	os.Exit(code)
}
