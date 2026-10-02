package git

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"konsupurt/internal/cognitivespace/revision"
)

func (r *Repository) LoadActivity(_ context.Context) (*revision.Activity, error) {
	data, err := os.ReadFile(r.activityPath())
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var activity revision.Activity
	if err := json.Unmarshal(data, &activity); err != nil {
		return nil, fmt.Errorf("decode active Interaction record: %w", err)
	}
	if len(activity.Base) != 40 || len(activity.LastPublished) != 40 || activity.Phase == "" {
		return nil, errors.New("active Interaction record is invalid")
	}
	return &activity, nil
}

func (r *Repository) StoreActivity(ctx context.Context, activity revision.Activity) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if len(activity.Base) != 40 || len(activity.LastPublished) != 40 || activity.Phase == "" {
		return errors.New("active Interaction record is invalid")
	}
	path := r.activityPath()
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(activity, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	temporary, err := os.CreateTemp(filepath.Dir(path), "active-*")
	if err != nil {
		return err
	}
	name := temporary.Name()
	defer os.Remove(name)
	if err := temporary.Chmod(0o600); err != nil {
		_ = temporary.Close()
		return err
	}
	if _, err := temporary.Write(data); err != nil {
		_ = temporary.Close()
		return err
	}
	if err := temporary.Sync(); err != nil {
		_ = temporary.Close()
		return err
	}
	if err := temporary.Close(); err != nil {
		return err
	}
	return replaceMetadataFile(name, path)
}

func (r *Repository) ClearActivity(_ context.Context) error {
	err := os.Remove(r.activityPath())
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}

func (r *Repository) activityPath() string {
	return filepath.Join(r.root, ".git", "konsupu", "active.json")
}
