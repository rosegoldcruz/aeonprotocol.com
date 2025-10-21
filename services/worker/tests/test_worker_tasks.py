def test_generate_image_task_structure():
    from services.worker.worker import generate_image
    assert generate_image.name == "worker.generate_image"
    assert getattr(generate_image, "max_retries", None) in (3, getattr(generate_image, "default_retry_delay", None))


def test_generate_video_task_structure():
    from services.worker.worker import generate_video
    assert generate_video.name == "worker.generate_video"
    assert getattr(generate_video, "max_retries", None) in (3, getattr(generate_video, "default_retry_delay", None))


def test_generate_audio_task_structure():
    from services.worker.worker import generate_audio
    assert generate_audio.name == "worker.generate_audio"
    assert getattr(generate_audio, "max_retries", None) in (3, getattr(generate_audio, "default_retry_delay", None))

